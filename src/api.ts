export const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

interface ContentBlock {
  type: string;
  text?: string;
}
interface ApiResponse {
  content: ContentBlock[];
}

export function extractText(data: unknown): string {
  if (typeof data !== "object" || data === null || !Array.isArray((data as ApiResponse).content)) {
    throw new Error("Unexpected API response structure.");
  }
  const text = (data as ApiResponse).content
    .filter(
      (b): b is ContentBlock & { text: string } => b.type === "text" && typeof b.text === "string"
    )
    .map((b) => b.text)
    .join("\n");
  if (!text) {
    throw new Error("Empty response from API.");
  }
  return text;
}

function handleHttpError(response: Response): never {
  const msg =
    response.status === 401 || response.status === 403
      ? "Authentication failed. Please check your API key in settings."
      : `API error ${response.status}.`;
  throw new Error(msg);
}

export async function callClaude(
  apiKey: string,
  userPrompt: string,
  maxTokens: number,
  systemPrompt?: string,
  model: string = DEFAULT_MODEL
): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };

  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: userPrompt }],
  };

  if (systemPrompt) {
    headers["anthropic-beta"] = "prompt-caching-2024-07-31";
    body.system = [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }];
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    handleHttpError(response);
  }
  return extractText(await response.json());
}
