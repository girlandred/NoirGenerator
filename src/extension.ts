import * as path from "path";
import * as vscode from "vscode";
import { StoryState, getLastCommit, getStoryState, saveStoryState, CommitData } from "./git";
import { generateChapter } from "./generator";
import { extractMetadata } from "./metadata";
import { maybeSummarize } from "./summarizer";
import { openStoryPanel } from "./storyPanel";
import { showCharacterSheet } from "./characterSheet";
import { requireWorkspaceRoot, getNoirConfig } from "./utils";

const SECRET_KEY = "noirCommits.anthropicApiKey";

async function setApiKey(context: vscode.ExtensionContext) {
  const input = await vscode.window.showInputBox({
    title: "Noir Commits: Set Anthropic API Key",
    prompt: "Paste your Anthropic API key. It will be stored encrypted in the OS keychain.",
    password: true,
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim().startsWith("sk-ant-") ? null : "Key should start with sk-ant-"),
  });

  if (!input) {
    return;
  }

  await context.secrets.store(SECRET_KEY, input.trim());
  vscode.window.showInformationMessage("Noir Commits: API key saved securely.");
}

async function deleteApiKey(context: vscode.ExtensionContext) {
  await context.secrets.delete(SECRET_KEY);
  vscode.window.showInformationMessage("Noir Commits: API key removed.");
}

async function resolveApiKey(context: vscode.ExtensionContext): Promise<string | undefined> {
  const stored = await context.secrets.get(SECRET_KEY);
  if (stored) {
    return stored;
  }

  const action = await vscode.window.showErrorMessage(
    "Noir Commits: No API key found. Set one to continue.",
    "Set API Key"
  );
  if (action === "Set API Key") {
    await setApiKey(context);
    return context.secrets.get(SECRET_KEY);
  }
  return undefined;
}

async function appendToStoryFile(
  root: string,
  commit: CommitData,
  chapterCount: number,
  chapter: string
): Promise<void> {
  const storyUri = vscode.Uri.file(path.join(root, "story.md"));
  const openDoc = vscode.workspace.textDocuments.find(
    (d) => d.uri.fsPath === storyUri.fsPath && d.isDirty
  );
  if (openDoc) {
    await openDoc.save();
  }

  let existing = "";
  try {
    existing = new TextDecoder().decode(await vscode.workspace.fs.readFile(storyUri));
  } catch {
    // file doesn't exist yet
  }

  const header = `*Chapter ${chapterCount} — ${commit.date}*\n\n`;
  const separator = existing ? "\n\n---\n\n" : "";
  await vscode.workspace.fs.writeFile(
    storyUri,
    new TextEncoder().encode(existing + separator + header + chapter)
  );
}

let writeInProgress = false;

async function runNoirWrite(context: vscode.ExtensionContext) {
  if (writeInProgress) {
    return;
  }
  writeInProgress = true;

  try {
    const apiKey = await resolveApiKey(context);
    if (!apiKey) {
      return;
    }

    const root = requireWorkspaceRoot();
    if (!root) {
      return;
    }

    await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "Noir Commits", cancellable: false },
      async (progress) => {
        progress.report({ message: "Reading the last commit…" });
        const [commit, state] = await Promise.all([getLastCommit(root), getStoryState(root)]);

        if (!commit) {
          vscode.window.showErrorMessage("Noir Commits: Could not read the last commit.");
          return;
        }
        if (state.lastProcessedHash === commit.hash) {
          vscode.window.showInformationMessage("Noir Commits: This commit already has a chapter.");
          return;
        }

        const { model } = getNoirConfig();

        progress.report({ message: "Writing the next chapter…" });
        const chapter = await generateChapter(commit, state, apiKey, model);

        progress.report({ message: "Updating characters and threads…" });
        const newChapters = [...state.chapters, { hash: commit.hash, chapter, date: commit.date }];
        const [metadata, summary] = await Promise.all([
          extractMetadata(chapter, state, apiKey, model),
          maybeSummarize({ ...state, chapters: newChapters }, apiKey, model),
        ]);

        const updatedState: StoryState = {
          ...state,
          chapters: newChapters,
          lastProcessedHash: commit.hash,
          chapterCount: state.chapterCount + 1,
          previousSummary: summary,
          characters: metadata.characters,
          openThreads: metadata.openThreads,
        };

        await Promise.all([
          saveStoryState(root, updatedState),
          appendToStoryFile(root, commit, updatedState.chapterCount, chapter),
        ]);

        openStoryPanel(context, root);
        vscode.window.showInformationMessage(
          `Noir Commits: Chapter written for "${commit.message}"`
        );
      }
    );
  } finally {
    writeInProgress = false;
  }
}

async function skipCommit() {
  const root = requireWorkspaceRoot();
  if (!root) {
    return;
  }

  const commit = await getLastCommit(root);
  if (!commit) {
    vscode.window.showErrorMessage("Noir Commits: Could not read the last commit.");
    return;
  }

  const state = await getStoryState(root);
  await saveStoryState(root, { ...state, lastProcessedHash: commit.hash });
  vscode.window.showInformationMessage(`Noir Commits: Skipped "${commit.message}".`);
}

export function activate(context: vscode.ExtensionContext) {
  let watcher: vscode.FileSystemWatcher | undefined;

  function startWatcher() {
    if (watcher) {
      return;
    }
    watcher = vscode.workspace.createFileSystemWatcher("**/.git/COMMIT_EDITMSG");
    watcher.onDidChange(() => runNoirWrite(context));
    watcher.onDidCreate(() => runNoirWrite(context));
  }

  function stopWatcher() {
    watcher?.dispose();
    watcher = undefined;
  }

  async function toggleAutoTrigger() {
    const { autoTrigger } = getNoirConfig();
    const cfg = vscode.workspace.getConfiguration("noirCommits");
    await cfg.update("autoTrigger", !autoTrigger, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      `Noir Commits: Auto-generate after commit ${!autoTrigger ? "enabled" : "disabled"}.`
    );
  }

  if (getNoirConfig().autoTrigger) {
    startWatcher();
  }

  context.subscriptions.push(
    vscode.commands.registerCommand("noirCommits.writeChapter", () => runNoirWrite(context)),
    vscode.commands.registerCommand("noirCommits.skipCommit", () => skipCommit()),
    vscode.commands.registerCommand("noirCommits.setApiKey", () => setApiKey(context)),
    vscode.commands.registerCommand("noirCommits.deleteApiKey", () => deleteApiKey(context)),
    vscode.commands.registerCommand("noirCommits.toggleAutoTrigger", toggleAutoTrigger),
    vscode.commands.registerCommand("noirCommits.openStoryPanel", () => {
      const root = requireWorkspaceRoot();
      if (root) {
        openStoryPanel(context, root);
      }
    }),
    vscode.commands.registerCommand("noirCommits.showCharacters", () => {
      const root = requireWorkspaceRoot();
      if (root) {
        showCharacterSheet(context, root);
      }
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (!e.affectsConfiguration("noirCommits.autoTrigger")) {
        return;
      }
      if (getNoirConfig().autoTrigger) {
        startWatcher();
      } else {
        stopWatcher();
      }
    }),
    { dispose: stopWatcher }
  );
}

export function deactivate() {}
