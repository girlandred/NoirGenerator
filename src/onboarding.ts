import * as vscode from "vscode";

const ONBOARDED_KEY = "noirCommits.onboarded";
const SECRET_KEY = "noirCommits.anthropicApiKey";

async function promptApiKey(context: vscode.ExtensionContext): Promise<void> {
  const input = await vscode.window.showInputBox({
    title: "Noir Commits — Anthropic API Key",
    prompt: "Paste your Anthropic API key. It will be stored encrypted in the OS keychain.",
    password: true,
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim().startsWith("sk-ant-") ? null : "Key should start with sk-ant-"),
  });

  if (input) {
    await context.secrets.store(SECRET_KEY, input.trim());
    vscode.window.showInformationMessage(
      "Noir Commits: API key saved. You're all set — write your first chapter!"
    );
  } else {
    vscode.window.showInformationMessage(
      'Noir Commits: No key set. You can add one later via "Noir Commits: Set API Key".'
    );
  }
}

export async function runOnboarding(context: vscode.ExtensionContext): Promise<void> {
  if (context.globalState.get(ONBOARDED_KEY)) {
    return;
  }

  const welcome = await vscode.window.showInformationMessage(
    "Welcome to Noir Commits! It turns your git commits into a noir detective story. Let's get you set up.",
    { modal: false },
    "Get Started",
    "Later"
  );

  if (welcome !== "Get Started") {
    return;
  }

  const disclosed = await vscode.window.showInformationMessage(
    "Noir Commits will send your commit messages, dates, and file-change summaries to Anthropic's API to generate story chapters. " +
      "Your git author name is never shared — you'll set a detective alias instead.",
    { modal: true },
    "Got it"
  );
  if (disclosed !== "Got it") {
    return;
  }

  const cfg = vscode.workspace.getConfiguration("noirCommits");
  const nameInput = await vscode.window.showInputBox({
    title: "Noir Commits — Your Detective Name",
    prompt: "Pick an alias for your character in the story. Your real name stays private.",
    placeHolder: "e.g. Marlowe, Noir, or leave blank to let the AI choose",
    ignoreFocusOut: true,
  });
  if (nameInput !== undefined) {
    await cfg.update("detectiveName", nameInput.trim(), vscode.ConfigurationTarget.Global);
  }

  await promptApiKey(context);

  await context.globalState.update(ONBOARDED_KEY, true);
}
