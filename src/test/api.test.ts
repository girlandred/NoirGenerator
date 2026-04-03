import * as assert from "assert";
import * as sinon from "sinon";
import { callClaude, extractText } from "../api";

describe("extractText", () => {
  it("returns text from a single text block", () => {
    const data = { content: [{ type: "text", text: "The city never sleeps." }] };
    assert.strictEqual(extractText(data), "The city never sleeps.");
  });

  it("joins multiple text blocks with newline", () => {
    const data = {
      content: [
        { type: "text", text: "First." },
        { type: "text", text: "Second." },
      ],
    };
    assert.strictEqual(extractText(data), "First.\nSecond.");
  });

  it("skips non-text content blocks", () => {
    const data = {
      content: [
        { type: "tool_use", text: "ignored" },
        { type: "text", text: "kept" },
      ],
    };
    assert.strictEqual(extractText(data), "kept");
  });

  it("throws on missing content array", () => {
    assert.throws(() => extractText({ foo: "bar" }), /Unexpected API response/);
  });

  it("throws on null input", () => {
    assert.throws(() => extractText(null), /Unexpected API response/);
  });

  it("throws on non-object input", () => {
    assert.throws(() => extractText("string"), /Unexpected API response/);
  });

  it("throws when content array is empty", () => {
    assert.throws(() => extractText({ content: [] }), /Empty response/);
  });

  it("throws when text blocks have no text property", () => {
    assert.throws(() => extractText({ content: [{ type: "text" }] }), /Empty response/);
  });
});

describe("callClaude", () => {
  let fetchStub: sinon.SinonStub;

  beforeEach(() => {
    fetchStub = sinon.stub(globalThis, "fetch" as any);
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns text on a successful response", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "Rain fell on the city." }] }),
    });
    const result = await callClaude("sk-ant-key", "prompt", 100);
    assert.strictEqual(result, "Rain fell on the city.");
  });

  it("sends the api key header", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    await callClaude("sk-ant-test-123", "prompt", 100);
    const [, options] = fetchStub.firstCall.args as [string, RequestInit & { headers: Record<string, string> }];
    assert.strictEqual(options.headers["x-api-key"], "sk-ant-test-123");
    assert.strictEqual(options.headers["anthropic-version"], "2023-06-01");
  });

  it("includes system prompt in body when provided", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    await callClaude("sk-ant-key", "user prompt", 100, "system prompt");
    const [, options] = fetchStub.firstCall.args as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    assert.ok(Array.isArray(body.system));
    assert.strictEqual(body.system[0].text, "system prompt");
  });

  it("sets anthropic-beta header when system prompt is provided", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    await callClaude("sk-ant-key", "user prompt", 100, "system prompt");
    const [, options] = fetchStub.firstCall.args as [string, RequestInit & { headers: Record<string, string> }];
    assert.strictEqual(options.headers["anthropic-beta"], "prompt-caching-2024-07-31");
  });

  it("does not set anthropic-beta header when no system prompt", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    await callClaude("sk-ant-key", "user prompt", 100);
    const [, options] = fetchStub.firstCall.args as [string, RequestInit & { headers: Record<string, string> }];
    assert.strictEqual(options.headers["anthropic-beta"], undefined);
  });

  it("includes the model in the request body", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    await callClaude("sk-ant-key", "prompt", 100, undefined, "claude-sonnet-4-6");
    const [, options] = fetchStub.firstCall.args as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    assert.strictEqual(body.model, "claude-sonnet-4-6");
  });

  it("uses the default model when none is specified", async () => {
    fetchStub.resolves({
      ok: true,
      json: async () => ({ content: [{ type: "text", text: "ok" }] }),
    });
    await callClaude("sk-ant-key", "prompt", 100);
    const [, options] = fetchStub.firstCall.args as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    assert.strictEqual(body.model, "claude-haiku-4-5-20251001");
  });

  it("throws with auth message on 401", async () => {
    fetchStub.resolves({ ok: false, status: 401 });
    await assert.rejects(callClaude("bad-key", "prompt", 100), /Authentication failed/);
  });

  it("throws with auth message on 403", async () => {
    fetchStub.resolves({ ok: false, status: 403 });
    await assert.rejects(callClaude("bad-key", "prompt", 100), /Authentication failed/);
  });

  it("throws with status code on other HTTP errors", async () => {
    fetchStub.resolves({ ok: false, status: 500 });
    await assert.rejects(callClaude("key", "prompt", 100), /API error 500/);
  });
});
