import * as assert from "assert";
import { sanitize, buildUserPrompt } from "../generator";
import { CommitData, StoryState } from "../git";

describe("sanitize", () => {
  it("returns string unchanged when within max length", () => {
    assert.strictEqual(sanitize("hello", 100), "hello");
  });

  it("truncates to max length", () => {
    assert.strictEqual(sanitize("hello world", 5), "hello");
  });

  it("trims leading and trailing whitespace", () => {
    assert.strictEqual(sanitize("  hi  ", 100), "hi");
  });

  it("removes ASCII control characters", () => {
    assert.strictEqual(sanitize("hel\x01lo", 100), "hello");
  });

  it("removes null bytes", () => {
    assert.strictEqual(sanitize("hel\x00lo", 100), "hello");
  });

  it("removes DEL character", () => {
    assert.strictEqual(sanitize("hel\x7Flo", 100), "hello");
  });

  it("preserves tabs and newlines (not stripped)", () => {
    assert.strictEqual(sanitize("a\tb\nc", 100), "a\tb\nc");
  });

  it("strips control chars before truncating", () => {
    assert.strictEqual(sanitize("ab\x01cd", 3), "abc");
  });
});

const baseCommit: CommitData = {
  hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
  message: "fix: resolve authentication bug",
  author: "Jane Doe",
  date: "2024-01-15",
  diffSummary: "src/auth.ts | 5 ++++\n1 file changed, 5 insertions(+)",
};

const emptyState: StoryState = {
  chapters: [],
  lastProcessedHash: null,
  chapterCount: 0,
  previousSummary: "",
  characters: {},
  openThreads: [],
};

describe("buildUserPrompt", () => {
  it("includes first-chapter setup text when no previous summary", () => {
    const prompt = buildUserPrompt(baseCommit, emptyState);
    assert.ok(prompt.includes("first chapter"), `Expected 'first chapter' in prompt`);
  });

  it("includes previousSummary when present", () => {
    const state = { ...emptyState, previousSummary: "It was a dark and stormy night." };
    const prompt = buildUserPrompt(baseCommit, state);
    assert.ok(prompt.includes("It was a dark and stormy night."));
  });

  it("does not include first-chapter text when summary exists", () => {
    const state = { ...emptyState, previousSummary: "Some prior context." };
    const prompt = buildUserPrompt(baseCommit, state);
    assert.ok(!prompt.includes("first chapter"));
  });

  it("includes commit message", () => {
    const prompt = buildUserPrompt(baseCommit, emptyState);
    assert.ok(prompt.includes("fix: resolve authentication bug"));
  });

  it("includes author name", () => {
    const prompt = buildUserPrompt(baseCommit, emptyState);
    assert.ok(prompt.includes("Jane Doe"));
  });

  it("includes diff summary", () => {
    const prompt = buildUserPrompt(baseCommit, emptyState);
    assert.ok(prompt.includes("src/auth.ts"));
  });

  it("includes known characters when present", () => {
    const state = { ...emptyState, characters: { "Detective Ross": "lead investigator" } };
    const prompt = buildUserPrompt(baseCommit, state);
    assert.ok(prompt.includes("Detective Ross"));
  });

  it("includes open threads when present", () => {
    const state = { ...emptyState, openThreads: ["Missing weapon case"] };
    const prompt = buildUserPrompt(baseCommit, state);
    assert.ok(prompt.includes("Missing weapon case"));
  });

  it("notes no characters when characters object is empty", () => {
    const prompt = buildUserPrompt(baseCommit, emptyState);
    assert.ok(prompt.includes("No established characters yet"));
  });

  it("notes no threads when openThreads is empty", () => {
    const prompt = buildUserPrompt(baseCommit, emptyState);
    assert.ok(prompt.includes("No open threads yet"));
  });

  it("truncates a commit message longer than 300 chars", () => {
    const commit = { ...baseCommit, message: "a".repeat(400) };
    const prompt = buildUserPrompt(commit, emptyState);
    assert.ok(prompt.includes("a".repeat(300)));
    assert.ok(!prompt.includes("a".repeat(301)));
  });

  it("truncates a diff summary longer than 2000 chars", () => {
    const commit = { ...baseCommit, diffSummary: "b".repeat(2500) };
    const prompt = buildUserPrompt(commit, emptyState);
    assert.ok(prompt.includes("b".repeat(2000)));
    assert.ok(!prompt.includes("b".repeat(2001)));
  });
});
