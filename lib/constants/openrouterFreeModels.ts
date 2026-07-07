/**
 * Free-tier models on OpenRouter the user wants available for the swarm.
 *
 * `id` is the exact string the OpenRouter API expects (e.g. passed as
 * `model` in a chat completion request). `verified` records whether that
 * id was confirmed against `https://openrouter.ai/api/v1/models` directly —
 * that endpoint's response is large enough that the fetch tool used here
 * only reliably returned a subset of it, so several ids below are
 * best-effort guesses following OpenRouter's naming convention, not
 * confirmed lookups. Re-check any `verified: false` entry against
 * https://openrouter.ai/models before wiring it into a real API call —
 * a wrong slug fails at request time with a 400, not at build time.
 */

export interface OpenRouterFreeModel {
  id: string;
  label: string;
  contextLength: number | null;
  verified: boolean;
  note?: string;
}

export const OPENROUTER_FREE_MODELS: OpenRouterFreeModel[] = [
  {
    id: "poolside/laguna-xs-2.1:free",
    label: "Poolside: Laguna XS 2.1",
    contextLength: 262144,
    verified: true,
  },
  {
    id: "cohere/north-mini-code:free",
    label: "Cohere: North Mini Code",
    contextLength: 256000,
    verified: true,
  },
  {
    id: "nvidia/nemotron-3.5-content-safety:free",
    label: "NVIDIA: Nemotron 3.5 Content Safety",
    contextLength: 128000,
    verified: true,
  },
  {
    id: "nvidia/nemotron-3-ultra-550b-a55b:free",
    label: "NVIDIA: Nemotron 3 Ultra",
    contextLength: 1000000,
    verified: true,
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "NVIDIA: Nemotron 3 Nano Omni",
    contextLength: 256000,
    verified: true,
  },
  {
    id: "poolside/laguna-xs.2:free",
    label: "Poolside: Laguna XS.2",
    contextLength: 262144,
    verified: true,
  },
  {
    id: "poolside/laguna-m.1:free",
    label: "Poolside: Laguna M.1",
    contextLength: 262144,
    verified: true,
  },
  {
    id: "google/gemma-4-26b-a4b:free",
    label: "Google: Gemma 4 26B A4B",
    contextLength: null,
    verified: false,
    note: "Gemma 4 postdates what could be confirmed — check exact slug on openrouter.ai/models.",
  },
  {
    id: "google/gemma-4-31b:free",
    label: "Google: Gemma 4 31B",
    contextLength: null,
    verified: false,
    note: "Gemma 4 postdates what could be confirmed — check exact slug on openrouter.ai/models.",
  },
  {
    id: "google/lyria-3-pro-preview:free",
    label: "Google: Lyria 3 Pro Preview",
    contextLength: null,
    verified: false,
    note: "Music generation, not text — confirm this even belongs in a text-model picker. Unverified slug.",
  },
  {
    id: "google/lyria-3-clip-preview:free",
    label: "Google: Lyria 3 Clip Preview",
    contextLength: null,
    verified: false,
    note: "Music generation, not text — confirm this even belongs in a text-model picker. Unverified slug.",
  },
  {
    id: "nvidia/nemotron-3-super:free",
    label: "NVIDIA: Nemotron 3 Super",
    contextLength: null,
    verified: false,
    note: "Parameter-count suffix unknown (other Nemotron 3 slugs encode it, e.g. -550b-a55b) — check exact slug.",
  },
  {
    id: "liquidai/lfm2.5-1.2b-thinking:free",
    label: "LiquidAI: LFM2.5-1.2B-Thinking",
    contextLength: null,
    verified: false,
    note: "Unverified provider prefix (could be \"liquid/\" instead of \"liquidai/\") — check exact slug.",
  },
  {
    id: "liquidai/lfm2.5-1.2b-instruct:free",
    label: "LiquidAI: LFM2.5-1.2B-Instruct",
    contextLength: null,
    verified: false,
    note: "Unverified provider prefix (could be \"liquid/\" instead of \"liquidai/\") — check exact slug.",
  },
  {
    id: "nvidia/nemotron-3-nano-30b-a3b:free",
    label: "NVIDIA: Nemotron 3 Nano 30B A3B",
    contextLength: null,
    verified: false,
    note: "Guessed by analogy to the verified Nemotron 3 Nano Omni slug — check exact slug.",
  },
  {
    id: "nvidia/nemotron-nano-12b-2-vl:free",
    label: "NVIDIA: Nemotron Nano 12B 2 VL",
    contextLength: null,
    verified: false,
    note: "Multimodal reasoning. Unverified slug.",
  },
  {
    id: "qwen/qwen3-next-80b-a3b-instruct:free",
    label: "Qwen: Qwen3 Next 80B A3B Instruct",
    contextLength: null,
    verified: false,
    note: "Unverified slug — fetch tool could not confirm against the live API.",
  },
  {
    id: "nvidia/nemotron-nano-9b-v2:free",
    label: "NVIDIA: Nemotron Nano 9B V2",
    contextLength: null,
    verified: false,
    note: "Unverified slug — fetch tool could not confirm against the live API.",
  },
  {
    id: "openai/gpt-oss-120b:free",
    label: "OpenAI: gpt-oss-120b",
    contextLength: null,
    verified: false,
    note: "Real released model, but this exact OpenRouter slug wasn't confirmed live — check before use.",
  },
  {
    id: "openai/gpt-oss-20b:free",
    label: "OpenAI: gpt-oss-20b",
    contextLength: null,
    verified: false,
    note: "Real released model, but this exact OpenRouter slug wasn't confirmed live — check before use.",
  },
  {
    id: "qwen/qwen3-coder-480b-a35b:free",
    label: "Qwen: Qwen3 Coder 480B A35B",
    contextLength: null,
    verified: false,
    note: "Real released model, but this exact OpenRouter slug wasn't confirmed live — check before use.",
  },
  {
    id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    label: "Venice: Uncensored (Dolphin Mistral 24B)",
    contextLength: null,
    verified: false,
    note: "Unverified slug — check before use.",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Meta: Llama 3.3 70B Instruct",
    contextLength: null,
    verified: false,
    note: "Very well-established model/slug pattern, high confidence, but not confirmed against the live API this session.",
  },
  {
    id: "meta-llama/llama-3.2-3b-instruct:free",
    label: "Meta: Llama 3.2 3B Instruct",
    contextLength: null,
    verified: false,
    note: "Very well-established model/slug pattern, high confidence, but not confirmed against the live API this session.",
  },
  {
    id: "nousresearch/hermes-3-llama-3.1-405b:free",
    label: "Nous: Hermes 3 405B Instruct",
    contextLength: null,
    verified: false,
    note: "Unverified slug — check before use.",
  },
];
