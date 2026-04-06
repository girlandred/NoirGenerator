import * as assert from "assert";
import * as sinon from "sinon";
import * as vscodeMock from "./mocks/vscode";
import { runOnboarding } from "../onboarding";

interface FakeContext {
  globalState: { get(key: string): unknown; update(key: string, value: unknown): Promise<void> };
  secrets: {
    store(key: string, value: string): Promise<void>;
    get(key: string): Promise<string | undefined>;
  };
  _stored: Map<string, string>;
}

function makeContext(onboarded = false): FakeContext {
  const state = new Map<string, unknown>([["noirCommits.onboarded", onboarded ? true : undefined]]);
  const stored = new Map<string, string>();
  return {
    globalState: {
      get: (key: string) => state.get(key),
      update: async (key: string, value: unknown) => {
        state.set(key, value);
      },
    },
    secrets: {
      store: async (key: string, value: string) => {
        stored.set(key, value);
      },
      get: async (key: string) => stored.get(key),
    },
    _stored: stored,
  };
}

function fakeConfig(updates: Record<string, unknown>) {
  return {
    get: (_key: string, defaultValue?: unknown) => defaultValue,
    update: async (key: string, value: unknown) => {
      updates[key] = value;
    },
  };
}

describe("runOnboarding", () => {
  afterEach(() => sinon.restore());

  it("does nothing when already onboarded", async () => {
    const ctx = makeContext(true);
    const infoStub = sinon.stub(vscodeMock.window, "showInformationMessage");
    await runOnboarding(ctx as never);
    assert.ok(infoStub.notCalled);
  });

  it("does nothing when user dismisses the welcome message", async () => {
    const ctx = makeContext(false);
    sinon.stub(vscodeMock.window, "showInformationMessage").resolves(undefined);
    const inputStub = sinon.stub(vscodeMock.window, "showInputBox");
    await runOnboarding(ctx as never);
    assert.ok(inputStub.notCalled);
    assert.strictEqual(ctx.globalState.get("noirCommits.onboarded"), undefined);
  });

  it("does nothing when user clicks Later", async () => {
    const ctx = makeContext(false);
    sinon.stub(vscodeMock.window, "showInformationMessage").resolves("Later");
    const inputStub = sinon.stub(vscodeMock.window, "showInputBox");
    await runOnboarding(ctx as never);
    assert.ok(inputStub.notCalled);
    assert.strictEqual(ctx.globalState.get("noirCommits.onboarded"), undefined);
  });

  it("does not mark onboarded when user dismisses the data disclosure modal", async () => {
    const ctx = makeContext(false);
    sinon
      .stub(vscodeMock.window, "showInformationMessage")
      .onFirstCall()
      .resolves("Get Started")
      .onSecondCall()
      .resolves(undefined);
    const inputStub = sinon.stub(vscodeMock.window, "showInputBox");
    await runOnboarding(ctx as never);
    assert.ok(inputStub.notCalled);
    assert.strictEqual(ctx.globalState.get("noirCommits.onboarded"), undefined);
  });

  it("saves detective name and API key when both are provided", async () => {
    const ctx = makeContext(false);
    sinon
      .stub(vscodeMock.window, "showInformationMessage")
      .onFirstCall()
      .resolves("Get Started")
      .onSecondCall()
      .resolves("Got it");
    sinon
      .stub(vscodeMock.window, "showInputBox")
      .onFirstCall()
      .resolves("Marlowe")
      .onSecondCall()
      .resolves("sk-ant-test-key");

    const updates: Record<string, unknown> = {};
    sinon.stub(vscodeMock.workspace, "getConfiguration").returns(fakeConfig(updates));

    await runOnboarding(ctx as never);

    assert.strictEqual(updates["detectiveName"], "Marlowe");
    assert.strictEqual(ctx._stored.get("noirCommits.anthropicApiKey"), "sk-ant-test-key");
    assert.strictEqual(ctx.globalState.get("noirCommits.onboarded"), true);
  });

  it("marks onboarded even when name and key prompts are skipped", async () => {
    const ctx = makeContext(false);
    sinon
      .stub(vscodeMock.window, "showInformationMessage")
      .onFirstCall()
      .resolves("Get Started")
      .onSecondCall()
      .resolves("Got it");
    sinon.stub(vscodeMock.window, "showInputBox").resolves(undefined);
    sinon.stub(vscodeMock.workspace, "getConfiguration").returns(fakeConfig({}));

    await runOnboarding(ctx as never);

    assert.strictEqual(ctx._stored.get("noirCommits.anthropicApiKey"), undefined);
    assert.strictEqual(ctx.globalState.get("noirCommits.onboarded"), true);
  });

  it("shows confirmation message when API key is saved", async () => {
    const ctx = makeContext(false);
    const infoStub = sinon
      .stub(vscodeMock.window, "showInformationMessage")
      .onFirstCall()
      .resolves("Get Started")
      .onSecondCall()
      .resolves("Got it")
      .resolves(undefined);
    sinon
      .stub(vscodeMock.window, "showInputBox")
      .onFirstCall()
      .resolves("")
      .onSecondCall()
      .resolves("sk-ant-mykey");
    sinon.stub(vscodeMock.workspace, "getConfiguration").returns(fakeConfig({}));

    await runOnboarding(ctx as never);

    const messages = infoStub.args.map((a) => a[0] as string);
    assert.ok(messages.some((m) => m.includes("all set")));
  });

  it("shows no-key message when key prompt is skipped", async () => {
    const ctx = makeContext(false);
    const infoStub = sinon
      .stub(vscodeMock.window, "showInformationMessage")
      .onFirstCall()
      .resolves("Get Started")
      .onSecondCall()
      .resolves("Got it")
      .resolves(undefined);
    sinon.stub(vscodeMock.window, "showInputBox").resolves(undefined);
    sinon.stub(vscodeMock.workspace, "getConfiguration").returns(fakeConfig({}));

    await runOnboarding(ctx as never);

    const messages = infoStub.args.map((a) => a[0] as string);
    assert.ok(messages.some((m) => m.includes("No key set")));
  });
});
