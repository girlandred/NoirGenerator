import * as vscode from "vscode";
import { DEFAULT_MODEL } from "./api";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatCharacters(characters: Record<string, string>): string {
  return Object.entries(characters)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");
}

export function formatThreads(threads: string[]): string {
  return threads.map((t) => `- ${t}`).join("\n");
}

export function requireWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.length) {
    vscode.window.showErrorMessage("Noir Commits: Open a workspace folder first.");
    return undefined;
  }
  return folders[0].uri.fsPath;
}

const VALID_MODELS = new Set([DEFAULT_MODEL, "claude-sonnet-4-6"]);

export function getNoirConfig(): { model: string; autoTrigger: boolean; detectiveName: string } {
  const cfg = vscode.workspace.getConfiguration("noirCommits");
  const rawModel = cfg.get<string>("model") ?? DEFAULT_MODEL;
  return {
    model: VALID_MODELS.has(rawModel) ? rawModel : DEFAULT_MODEL,
    autoTrigger: cfg.get<boolean>("autoTrigger") ?? false,
    detectiveName: (cfg.get<string>("detectiveName") ?? "").trim(),
  };
}
