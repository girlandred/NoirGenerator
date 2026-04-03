import * as assert from "assert";
import * as sinon from "sinon";
import * as apiModule from "../api";
import { maybeSummarize } from "../summarizer";
import { StoryState } from "../git";

const emptyState: StoryState = {
  chapters: [],
  lastProcessedHash: null,
  chapterCount: 0,
  previousSummary: "",
  characters: {},
  openThreads: [],
};

describe("maybeSummarize", () => {
  afterEach(() => sinon.restore());

  it("returns empty string when there are no chapters", async () => {
    const result = await maybeSummarize(emptyState, "key", "model");
    assert.strictEqual(result, "");
  });

  it("returns the full story when under the 2000-char threshold", async () => {
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: "Short chapter.", date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, "key", "model");
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
    const result = await maybeSummarize(state, "key", "model");
    assert.ok(result.includes("Chapter one."));
    assert.ok(result.includes("Chapter two."));
  });

  it("returns the full story when story is exactly 2000 chars (boundary)", async () => {
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: "x".repeat(2000), date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, "key", "model");
    assert.strictEqual(result.length, 2000);
  });

  it("calls callClaude when story exceeds the 2000-char threshold", async () => {
    const stub = sinon.stub(apiModule, "callClaude").resolves("Compressed summary.");
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: "x".repeat(2001), date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, "sk-ant-key", "model");
    assert.strictEqual(result, "Compressed summary.");
    assert.ok(stub.calledOnce);
  });

  it("falls back to last 2000 chars of story when callClaude throws", async () => {
    sinon.stub(apiModule, "callClaude").rejects(new Error("API error"));
    const longChapter = "y".repeat(2001);
    const state = {
      ...emptyState,
      chapters: [{ hash: "abc", chapter: longChapter, date: "2024-01-01" }],
    };
    const result = await maybeSummarize(state, "key", "model");
    assert.strictEqual(result.length, 2000);
  });
});
