import { CommitData, StoryState } from "./git";
import { callClaude } from "./api";
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
- Markdown only
- A short chapter (150–300 words)
- Begin with a chapter title as ## heading
- Body text only — no explanations, no meta-commentary outside the story`;

const sanitize = (s: string, max: number) =>
  s
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .substring(0, max)
    .trim();

function buildUserPrompt(commit: CommitData, state: StoryState): string {
  const previousContext = state.previousSummary
    ? `Previous story context:\n${state.previousSummary}`
    : "This is the first chapter. Establish the setting: a rain-soaked city, a weary detective, a case just opened.";

  const charList = formatCharacters(state.characters);
  const charactersContext = charList
    ? `Known characters:\n${charList}`
    : "No established characters yet.";

  const threadList = formatThreads(state.openThreads ?? []);
  const threadsContext = threadList ? `Open plot threads:\n${threadList}` : "No open threads yet.";

  const author = sanitize(commit.author, 100);

  return `${previousContext}

${charactersContext}

${threadsContext}

Commit data:
- Message: ${sanitize(commit.message, 300)}
- Author: ${author}
- Date: ${sanitize(commit.date, 20)}
- Diff summary:
${sanitize(commit.diffSummary, 2000)}

Instructions:
1. Decide what kind of narrative event this commit represents.
2. Continue the story logically from the previous context.
3. Introduce or evolve tension if appropriate.
4. Keep it grounded — do not become surreal or fantastical.
5. If the commit is small, keep the scene short and subtle.
6. The author name "${author}" should become a recurring character name.
7. Advance or resolve at least one open thread if appropriate.

Write the next chapter.`;
}

export async function generateChapter(
  commit: CommitData,
  state: StoryState,
  apiKey: string,
  model: string
): Promise<string> {
  return callClaude(apiKey, buildUserPrompt(commit, state), 1000, SYSTEM_PROMPT, model);
}
