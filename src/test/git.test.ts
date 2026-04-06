import * as assert from "assert";
import { isValidHash, isValidState } from "../git";

describe("isValidHash", () => {
  it("accepts a valid 40-char lowercase hex hash", () => {
    assert.strictEqual(isValidHash("a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"), true);
  });

  it("accepts a hash of all zeros", () => {
    assert.strictEqual(isValidHash("0".repeat(40)), true);
  });

  it("rejects a hash that is too short", () => {
    assert.strictEqual(isValidHash("abc123"), false);
  });

  it("rejects a hash that is too long", () => {
    assert.strictEqual(isValidHash("a".repeat(41)), false);
  });

  it("rejects a hash with uppercase letters", () => {
    assert.strictEqual(isValidHash("A".repeat(40)), false);
  });

  it("rejects a hash with non-hex characters", () => {
    assert.strictEqual(isValidHash("g".repeat(40)), false);
  });

  it("rejects an empty string", () => {
    assert.strictEqual(isValidHash(""), false);
  });
});

describe("isValidState", () => {
  const validState = {
    chapters: [],
    lastProcessedHash: null,
    chapterCount: 0,
    previousSummary: "",
    characters: {},
    openThreads: [],
  };

  it("accepts a minimal valid state", () => {
    assert.strictEqual(isValidState(validState), true);
  });

  it("accepts state with lastProcessedHash as a string", () => {
    assert.strictEqual(isValidState({ ...validState, lastProcessedHash: "abc123" }), true);
  });

  it("accepts state with non-empty chapters array", () => {
    const state = {
      ...validState,
      chapters: [{ hash: "abc", chapter: "text", date: "2024-01-01" }],
    };
    assert.strictEqual(isValidState(state), true);
  });

  it("rejects null", () => {
    assert.strictEqual(isValidState(null), false);
  });

  it("rejects an array", () => {
    assert.strictEqual(isValidState([]), false);
  });

  it("rejects a non-object primitive", () => {
    assert.strictEqual(isValidState("string"), false);
  });

  it("rejects state with missing chapters field", () => {
    const rest: Record<string, unknown> = { ...validState };
    delete rest.chapters;
    assert.strictEqual(isValidState(rest), false);
  });

  it("rejects state where chapterCount is a string", () => {
    assert.strictEqual(isValidState({ ...validState, chapterCount: "0" }), false);
  });

  it("rejects state where characters is an array", () => {
    assert.strictEqual(isValidState({ ...validState, characters: [] }), false);
  });

  it("rejects state where characters is null", () => {
    assert.strictEqual(isValidState({ ...validState, characters: null }), false);
  });

  it("rejects state where openThreads is not an array", () => {
    assert.strictEqual(isValidState({ ...validState, openThreads: "thread" }), false);
  });

  it("rejects state where previousSummary is a number", () => {
    assert.strictEqual(isValidState({ ...validState, previousSummary: 0 }), false);
  });

  it("rejects state where lastProcessedHash is a number", () => {
    assert.strictEqual(isValidState({ ...validState, lastProcessedHash: 42 }), false);
  });

  it("rejects state where chapters contains a non-object item", () => {
    assert.strictEqual(isValidState({ ...validState, chapters: [null] }), false);
    assert.strictEqual(isValidState({ ...validState, chapters: [42] }), false);
    assert.strictEqual(isValidState({ ...validState, chapters: ["string"] }), false);
  });

  it("rejects a chapter item missing the hash field", () => {
    assert.strictEqual(
      isValidState({ ...validState, chapters: [{ chapter: "text", date: "2024-01-01" }] }),
      false
    );
  });

  it("rejects a chapter item missing the chapter field", () => {
    assert.strictEqual(
      isValidState({ ...validState, chapters: [{ hash: "abc", date: "2024-01-01" }] }),
      false
    );
  });

  it("rejects a chapter item missing the date field", () => {
    assert.strictEqual(
      isValidState({ ...validState, chapters: [{ hash: "abc", chapter: "text" }] }),
      false
    );
  });

  it("rejects a chapter item where hash is not a string", () => {
    assert.strictEqual(
      isValidState({
        ...validState,
        chapters: [{ hash: 123, chapter: "text", date: "2024-01-01" }],
      }),
      false
    );
  });

  it("accepts a well-formed chapter item", () => {
    assert.strictEqual(
      isValidState({
        ...validState,
        chapters: [{ hash: "abc", chapter: "text", date: "2024-01-01" }],
      }),
      true
    );
  });
});
