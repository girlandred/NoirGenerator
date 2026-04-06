import { StoryState } from "./git";
import { LLMCaller } from "./api";

const SUMMARY_THRESHOLD = 2000;

const SUMMARIZER_SYSTEM_PROMPT = `Compress noir detective stories into a 250-word summary. Preserve: key plot developments, character states, atmosphere, and unresolved tension. Write in noir prose style, third-person past tense.`;

export async function maybeSummarize(state: StoryState, caller: LLMCaller): Promise<string> {
  const fullStory = state.chapters.map((c) => c.chapter).join("\n\n---\n\n");

  if (fullStory.length <= SUMMARY_THRESHOLD) {
    return fullStory;
  }

  try {
    return await caller(fullStory, 400, SUMMARIZER_SYSTEM_PROMPT);
  } catch {
    return fullStory.slice(-SUMMARY_THRESHOLD);
  }
}
