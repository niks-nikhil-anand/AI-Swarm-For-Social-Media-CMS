// Server-side OpenRouter chat client used by the agent worker.
// Never import from client components — it reads OPENROUTER_API_KEY.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 120_000;

// Verified free-tier models (lib/constants/openrouterFreeModels.ts), tried in
// order — a 404/400 on one slug falls through to the next.
export const AGENT_MODEL_CHAIN = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "poolside/laguna-m.1:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

export interface ChatUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface AgentChatResult {
  /** Parsed JSON object the agent returned. */
  output: Record<string, unknown>;
  /** Raw model text, kept for the audit trail. */
  raw: string;
  model: string;
  usage: ChatUsage;
}

class LlmError extends Error {
  constructor(message: string, readonly retryableWithNextModel: boolean) {
    super(message);
  }
}

async function callModel(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ raw: string; usage: ChatUsage }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new LlmError("OPENROUTER_API_KEY is not set", false);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Swarm Research",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // Bad slug / model unavailable → try the next model in the chain.
      throw new LlmError(
        `OpenRouter ${res.status} for ${model}: ${body.slice(0, 300)}`,
        res.status === 400 || res.status === 404 || res.status === 429 || res.status >= 500
      );
    }

    const data = await res.json();
    const raw: string = data.choices?.[0]?.message?.content ?? "";
    if (!raw) throw new LlmError(`Empty completion from ${model}`, true);
    return {
      raw,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  } catch (err) {
    if (err instanceof LlmError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError(`Timeout after ${REQUEST_TIMEOUT_MS}ms on ${model}`, true);
    }
    throw new LlmError(err instanceof Error ? err.message : String(err), true);
  } finally {
    clearTimeout(timeout);
  }
}

/** Extract the first JSON object from a completion, tolerating stray prose/fences. */
function parseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Model did not return a parseable JSON object");
  }
}

/**
 * Run one agent turn: system prompt + task, falling through the model chain
 * on model-level failures. Throws if every model fails.
 */
export async function runAgentChat(
  systemPrompt: string,
  userPrompt: string,
  models: string[] = AGENT_MODEL_CHAIN
): Promise<AgentChatResult> {
  let lastError: Error | null = null;
  for (const model of models) {
    try {
      const { raw, usage } = await callModel(model, systemPrompt, userPrompt);
      return { output: parseJsonObject(raw), raw, model, usage };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err instanceof LlmError && !err.retryableWithNextModel) break;
    }
  }
  throw lastError ?? new Error("All models failed");
}
