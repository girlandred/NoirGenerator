import { CommitData, StoryState } from "./git";
import { LLMCaller } from "./api";
import { formatCharacters, formatThreads } from "./utils";

const SYSTEM_PROMPT = `You are a noir detective novelist. You transform software development activity into a dark, atmospheric detective story.
Your tone is concise, tense, and slightly cynical. Avoid humor unless it is dry and subtle.

You must:
- Maintain narrative continuity with prior chapters
- Use consistent characters and setting
- Interpret code changes as meaningful plot events (not literal code descriptions)

Mapping rules:
- Developer → detective or agent
- Bug → crime, anomaly, or suspect
- Feature → new lead, tool, or case development
- Refactor → re-examining evidence or reorganizing case files
- Tests → interrogations or verification of alibis
- Errors → contradictions or lies
- Fix → closing a lead, neutralizing a suspect

Output format:
1. A short chapter (150–300 words) as markdown, beginning with a ## heading. Body text only — no meta-commentary.
2. Immediately after the chapter, a single JSON block:
\`\`\`json
{"characters": {"Name": "one-sentence role"}, "openThreads": ["thread 1"]}
\`\`\`
Metadata rules:
- Merge existing characters with new ones; update descriptions if a role evolved
- Remove threads resolved in this chapter; keep unresolved ones; add new ones introduced
- Maximum 5 open threads, maximum 15 words each`;

export const sanitize = (s: string, max: number) =>
  s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .substring(0, max)
    .trim();

export function buildUserPrompt(
  commit: CommitData,
  state: StoryState,
  detectiveName?: string
): string {
  const previousContext = state.previousSummary
    ? `Previous story context:\n${state.previousSummary}`
    : "This is the first chapter. Establish the setting: a rain-soaked city, a weary detective, a case just opened.";

  const charList = formatCharacters(state.characters);
  const charactersContext = charList
    ? `Known characters:\n${charList}`
    : "No established characters yet.";

  const threadList = formatThreads(state.openThreads ?? []);
  const threadsContext = threadList ? `Open plot threads:\n${threadList}` : "No open threads yet.";

  const nameInstruction = detectiveName
    ? `6. The detective's name is "${sanitize(detectiveName, 60)}". Use this as the protagonist's recurring name.`
    : "6. If no protagonist name is established yet, invent an appropriate noir detective name and keep it consistent.";

  return `${previousContext}

${charactersContext}

${threadsContext}

Commit data:
- Message: ${sanitize(commit.message, 300)}
- Date: ${sanitize(commit.date, 20)}
- Diff summary:
${sanitize(commit.diffSummary, 2000)}

Instructions:
1. Decide what kind of narrative event this commit represents.
2. Continue the story logically from the previous context.
3. Introduce or evolve tension if appropriate.
4. Keep it grounded — do not become surreal or fantastical.
5. If the commit is small, keep the scene short and subtle.
${nameInstruction}
7. Advance or resolve at least one open thread if appropriate.

Write the next chapter.`;
}

export interface ChapterResult {
  chapter: string;
  characters: Record<string, string>;
  openThreads: string[];
}

export function parseChapterResult(
  raw: string,
  fallback: Omit<ChapterResult, "chapter">
): ChapterResult {
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```\s*$/);
  if (!jsonMatch) {
    return { chapter: raw.trim(), ...fallback };
  }
  const chapter = raw.slice(0, raw.lastIndexOf("```json")).trim();
  try {
    const parsed = JSON.parse(jsonMatch[1], (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return undefined;
      }
      return value;
    });
    return {
      chapter,
      characters: parsed.characters ?? fallback.characters,
      openThreads: parsed.openThreads ?? fallback.openThreads,
    };
  } catch {
    return { chapter, ...fallback };
  }
}

export async function generateChapter(
  commit: CommitData,
  state: StoryState,
  caller: LLMCaller,
  detectiveName?: string
): Promise<ChapterResult> {
  const raw = await caller(buildUserPrompt(commit, state, detectiveName), 600, SYSTEM_PROMPT);
  return parseChapterResult(raw, {
    characters: state.characters,
    openThreads: state.openThreads ?? [],
  });
}
