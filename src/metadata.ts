import { StoryState } from "./git";
import { callClaude } from "./api";
import { formatCharacters, formatThreads } from "./utils";

const METADATA_SYSTEM_PROMPT = `Analyze noir story chapters and update story metadata.

Return ONLY valid JSON in exactly this format:
{
  "characters": { "Character Name": "one-sentence role or description" },
  "openThreads": ["unresolved thread 1", "unresolved thread 2"]
}

Rules:
- Merge existing characters with any new ones from this chapter; update descriptions if a role evolved
- Remove threads resolved in this chapter; keep unresolved ones; add new ones introduced
- Maximum 5 open threads, maximum 15 words each`;

export async function extractMetadata(
  chapter: string,
  state: StoryState,
  apiKey: string,
  model: string
): Promise<{ characters: Record<string, string>; openThreads: string[] }> {
  const existingChars = formatCharacters(state.characters) || "None.";
  const existingThreads = formatThreads(state.openThreads ?? []) || "None.";

  const userPrompt = `Existing characters:
${existingChars}

Existing open threads:
${existingThreads}

New chapter:
${chapter}`;

  try {
    const text = await callClaude(apiKey, userPrompt, 500, METADATA_SYSTEM_PROMPT, model);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    const parsed = JSON.parse(jsonMatch[0], (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return undefined;
      }
      return value;
    });
    return {
      characters: parsed.characters ?? state.characters,
      openThreads: parsed.openThreads ?? state.openThreads ?? [],
    };
  } catch {
    return { characters: state.characters, openThreads: state.openThreads ?? [] };
  }
}
