import { createIdempotencyKey } from "./hash";

export interface PostizAccount {
  id: string;
  platform: string;
  name?: string;
  handle?: string;
  raw?: unknown;
}

export interface PostizScheduleInput {
  platform: "LinkedIn" | "X";
  accountId: string;
  text: string;
  scheduledFor: Date;
  media?: string[];
  idempotencyKey?: string;
}

export interface PostizScheduleResult {
  postizPostId: string;
  platformPostId?: string;
  status: string;
  raw?: unknown;
}

export class PostizClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(options?: { baseUrl?: string; apiKey?: string }) {
    this.baseUrl = (options?.baseUrl ?? process.env.POSTIZ_URL ?? "http://localhost:5001").replace(/\/$/, "");
    this.apiKey = options?.apiKey ?? process.env.POSTIZ_API_KEY;
  }

  private headers(extra?: HeadersInit): HeadersInit {
    return {
      "content-type": "application/json",
      ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      ...extra,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: this.headers(init?.headers),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Postiz request failed (${res.status}): ${text || res.statusText}`);
    }

    return (await res.json()) as T;
  }

  listAccounts(): Promise<PostizAccount[]> {
    return this.request<PostizAccount[]>("/api/accounts");
  }

  createScheduleInputKey(input: PostizScheduleInput): string {
    return input.idempotencyKey ?? createIdempotencyKey([
      input.platform,
      input.accountId,
      input.scheduledFor,
      input.text,
    ]);
  }

  schedulePost(input: PostizScheduleInput): Promise<PostizScheduleResult> {
    return this.request<PostizScheduleResult>("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        accountId: input.accountId,
        platform: input.platform,
        text: input.text,
        media: input.media ?? [],
        scheduledFor: input.scheduledFor.toISOString(),
        idempotencyKey: this.createScheduleInputKey(input),
      }),
    });
  }

  getPostStatus(postizPostId: string): Promise<PostizScheduleResult> {
    return this.request<PostizScheduleResult>(`/api/posts/${encodeURIComponent(postizPostId)}`);
  }
}

export function getPostizClient() {
  return new PostizClient();
}
