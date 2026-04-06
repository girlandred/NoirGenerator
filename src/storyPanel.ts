import * as path from "path";
import * as vscode from "vscode";
import { escapeHtml } from "./utils";

const panels = new Map<string, vscode.WebviewPanel>();

function markdownToHtml(md: string): string {
  if (!md.trim()) {
    return `<p class="empty">The story hasn't started yet. Write your first chapter.</p>`;
  }

  return md
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim();
      if (trimmed === "---") {
        return "<hr>";
      }
      if (trimmed.startsWith("## ")) {
        return `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      }
      if (trimmed.startsWith("# ")) {
        return `<h1>${escapeHtml(trimmed.slice(2))}</h1>`;
      }
      const inline = escapeHtml(trimmed)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\n/g, "<br>");
      return `<p>${inline}</p>`;
    })
    .join("\n");
}

function buildHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; link-src https:;">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0d0b09;
    color: #c4b49a;
    font-family: "Courier New", Courier, monospace;
    font-size: 15px;
    line-height: 1.85;
    padding: 48px 24px 80px;
  }
  .container { max-width: 660px; margin: 0 auto; }
  h1 {
    font-size: 1em;
    color: #7a6e60;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    border-bottom: 1px solid #1e1c18;
    padding-bottom: 1em;
    margin-bottom: 2.5em;
  }
  h2 {
    font-size: 1em;
    color: #e8dcc8;
    letter-spacing: 0.08em;
    margin: 2em 0 0.6em;
  }
  p { margin-bottom: 0.9em; }
  em { color: #7a6e60; font-style: italic; }
  strong { color: #e8dcc8; }
  hr {
    border: none;
    border-top: 1px solid #1e1c18;
    margin: 2.5em 0;
  }
  .empty { color: #3a3530; font-style: italic; padding: 5em 0; text-align: center; }
  .footer {
    margin-top: 4em;
    padding-top: 1.2em;
    border-top: 1px solid #1e1c18;
    color: #3a3530;
    font-size: 0.8em;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer a { color: #3a3530; text-decoration: underline; }
</style>
</head>
<body>
<div class="container">
<h1>Noir Story</h1>
${markdownToHtml(content)}
<div class="footer">
  <span>&#x2756; AI-generated content</span>
  <a href="https://github.com/girlandred/NoirGenerator/issues">Report an issue</a>
</div>
</div>
</body>
</html>`;
}

async function refreshContent(root: string) {
  const panel = panels.get(root);
  if (!panel) {
    return;
  }
  const storyUri = vscode.Uri.file(path.join(root, "story.md"));
  let content = "";
  try {
    content = new TextDecoder().decode(await vscode.workspace.fs.readFile(storyUri));
  } catch {
    // no story file yet
  }
  panel.webview.html = buildHtml(content);
}

export function openStoryPanel(context: vscode.ExtensionContext, root: string) {
  const existing = panels.get(root);
  if (existing) {
    existing.reveal(vscode.ViewColumn.One);
    refreshContent(root);
    return;
  }

  const panel = vscode.window.createWebviewPanel("noirStory", "Noir Story", vscode.ViewColumn.One, {
    enableScripts: false,
  });
  panels.set(root, panel);

  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(root, "story.md")
  );
  watcher.onDidChange(() => refreshContent(root), null, context.subscriptions);
  watcher.onDidCreate(() => refreshContent(root), null, context.subscriptions);

  panel.onDidDispose(
    () => {
      panels.delete(root);
      watcher.dispose();
    },
    null,
    context.subscriptions
  );

  refreshContent(root);
}
