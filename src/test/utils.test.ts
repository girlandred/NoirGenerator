import * as assert from "assert";
import { escapeHtml, formatCharacters, formatThreads } from "../utils";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    assert.strictEqual(escapeHtml("a & b"), "a &amp; b");
  });
  it("escapes less-than", () => {
    assert.strictEqual(escapeHtml("<div>"), "&lt;div&gt;");
  });
  it("escapes greater-than", () => {
    assert.strictEqual(escapeHtml("a > b"), "a &gt; b");
  });
  it("escapes all three in one string", () => {
    assert.strictEqual(escapeHtml("<a & b>"), "&lt;a &amp; b&gt;");
  });
  it("returns empty string unchanged", () => {
    assert.strictEqual(escapeHtml(""), "");
  });
  it("leaves plain text unchanged", () => {
    assert.strictEqual(escapeHtml("hello world"), "hello world");
  });
});

describe("formatCharacters", () => {
  it("formats a single character", () => {
    assert.strictEqual(
      formatCharacters({ "Detective Ross": "lead investigator" }),
      "- Detective Ross: lead investigator"
    );
  });
  it("formats multiple characters", () => {
    const result = formatCharacters({ Ross: "detective", Mara: "informant" });
    assert.strictEqual(result, "- Ross: detective\n- Mara: informant");
  });
  it("returns empty string for empty object", () => {
    assert.strictEqual(formatCharacters({}), "");
  });
});

describe("formatThreads", () => {
  it("formats a single thread", () => {
    assert.strictEqual(formatThreads(["Missing weapon"]), "- Missing weapon");
  });
  it("formats multiple threads", () => {
    assert.strictEqual(formatThreads(["Thread A", "Thread B"]), "- Thread A\n- Thread B");
  });
  it("returns empty string for empty array", () => {
    assert.strictEqual(formatThreads([]), "");
  });
});
