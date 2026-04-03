import * as assert from "assert";
import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { getStoryState, saveStoryState, StoryState } from "../../../git";
import { getNoirConfig } from "../../../utils";

const EXTENSION_ID = "nonsleeper.noir-commits";

const EXPECTED_COMMANDS = [
  "noirCommits.writeChapter",
  "noirCommits.skipCommit",
  "noirCommits.setApiKey",
  "noirCommits.deleteApiKey",
  "noirCommits.toggleAutoTrigger",
  "noirCommits.openStoryPanel",
  "noirCommits.showCharacters",
];

describe("Noir Commits — integration", () => {
  before(async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `Extension ${EXTENSION_ID} not found — check publisher/name in package.json`);
    if (!ext.isActive) {
      await ext.activate();
    }
  });


  describe("command registration", () => {
    it("registers all expected commands", async () => {
      const allCommands = await vscode.commands.getCommands(true);
      for (const cmd of EXPECTED_COMMANDS) {
        assert.ok(allCommands.includes(cmd), `Command not registered: ${cmd}`);
      }
    });
  });


  describe("configuration", () => {
    after(async () => {
      const cfg = vscode.workspace.getConfiguration("noirCommits");
      await cfg.update("model", undefined, vscode.ConfigurationTarget.Global);
      await cfg.update("autoTrigger", undefined, vscode.ConfigurationTarget.Global);
    });

    it("returns false for autoTrigger by default", () => {
      const { autoTrigger } = getNoirConfig();
      assert.strictEqual(autoTrigger, false);
    });

    it("returns a valid model string by default", () => {
      const { model } = getNoirConfig();
      assert.ok(
        model === "claude-haiku-4-5-20251001" || model === "claude-sonnet-4-6",
        `Unexpected model: ${model}`
      );
    });

    it("falls back to the default model for an unrecognised model value", async () => {
      const cfg = vscode.workspace.getConfiguration("noirCommits");
      await cfg.update("model", "claude-unknown-xyz", vscode.ConfigurationTarget.Global);
      const { model } = getNoirConfig();
      assert.strictEqual(model, "claude-haiku-4-5-20251001");
    });

    it("reflects autoTrigger toggle", async () => {
      const cfg = vscode.workspace.getConfiguration("noirCommits");
      await cfg.update("autoTrigger", true, vscode.ConfigurationTarget.Global);
      assert.strictEqual(getNoirConfig().autoTrigger, true);
      await cfg.update("autoTrigger", false, vscode.ConfigurationTarget.Global);
      assert.strictEqual(getNoirConfig().autoTrigger, false);
    });
  });

  describe("story state", () => {
    let tmpDir: string;

    before(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "noir-test-"));
    });

    after(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("returns an empty default state when no file exists", async () => {
      const state = await getStoryState(tmpDir);
      assert.deepStrictEqual(state, {
        chapters: [],
        lastProcessedHash: null,
        chapterCount: 0,
        previousSummary: "",
        characters: {},
        openThreads: [],
      });
    });

    it("round-trips state through save and load", async () => {
      const state: StoryState = {
        chapters: [{ hash: "a1b2c3", chapter: "Rain fell on the city.", date: "2024-01-01" }],
        lastProcessedHash: "a1b2c3",
        chapterCount: 1,
        previousSummary: "Rain fell on the city.",
        characters: { "Detective Ross": "lead investigator" },
        openThreads: ["Missing weapon"],
      };
      await saveStoryState(tmpDir, state);
      const loaded = await getStoryState(tmpDir);
      assert.deepStrictEqual(loaded, state);
    });

    it("returns a fresh default state when the saved file is corrupted", async () => {
      const statePath = path.join(tmpDir, ".noir-commits-state.json");
      fs.writeFileSync(statePath, "{ not valid json %%% }");
      const state = await getStoryState(tmpDir);
      assert.strictEqual(state.chapterCount, 0);
      assert.deepStrictEqual(state.chapters, []);
    });

    it("silently drops __proto__ keys from saved state (prototype pollution guard)", async () => {
      const statePath = path.join(tmpDir, ".noir-commits-state.json");
      fs.writeFileSync(
        statePath,
        JSON.stringify({
          chapters: [],
          lastProcessedHash: null,
          chapterCount: 0,
          previousSummary: "",
          characters: {},
          openThreads: [],
          __proto__: { polluted: true },
        })
      );
      await getStoryState(tmpDir);
      assert.strictEqual((Object.prototype as any).polluted, undefined);
    });
  });
});
