import * as assert from "assert";
import { maybeSummarize } from "../summarizer";
import { StoryState } from "../git";
import { LLMCaller } from "../api";

const noCaller: LLMCaller = async () => {
  throw new Error("caller should not be invoked");
};

const emptyState: StoryState = {
  chapters: [],
  lastProcessedHash: null,
  chapterCount: 0,
  previousSummary: "",
  characters: {},
  openThreads: [],
};

describe("maybeSummarize", () => {
  it("returns empty string when there are no chapters", async () => {
    const result = await maybeSummarize(emptyState, noCaller);
    assert.strictEqual(result, "");
  });

  it("returns the full story when under the 2000-char threshold", async () => {
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: "Short chapter.", date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, noCaller);
    assert.strictEqual(result, "Short chapter.");
  });

  it("joins multiple chapters with separators when under threshold", async () => {
    const state = {
      ...emptyState,
      chapters: [
        { hash: "a", chapter: "Chapter one.", date: "2024-01-01" },
        { hash: "b", chapter: "Chapter two.", date: "2024-01-02" },
      ],
    };
    const result = await maybeSummarize(state, noCaller);
    assert.ok(result.includes("Chapter one."));
    assert.ok(result.includes("Chapter two."));
  });

  it("returns the full story when story is exactly 2000 chars (boundary)", async () => {
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: "x".repeat(2000), date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, noCaller);
    assert.strictEqual(result.length, 2000);
  });

  it("calls the caller when story exceeds the 2000-char threshold", async () => {
    let called = false;
    const caller: LLMCaller = async () => {
      called = true;
      return "Compressed summary.";
    };
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: "x".repeat(2001), date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, caller);
    assert.strictEqual(result, "Compressed summary.");
    assert.ok(called);
  });

  it("falls back to last 2000 chars of story when caller throws", async () => {
    const caller: LLMCaller = async () => {
      throw new Error("API error");
    };
    const longChapter = "y".repeat(2001);
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: longChapter, date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, caller);
    assert.strictEqual(result.length, 2000);
  });
});
