import * as vscode from "vscode";
import { StoryState, getStoryState } from "./git";
import { escapeHtml } from "./utils";

const panels = new Map<string, vscode.WebviewPanel>();

function buildHtml(state: StoryState): string {
  const { characters, openThreads = [], chapterCount } = state;
  const charEntries = Object.entries(characters);

  const charsHtml =
    charEntries.length > 0
      ? charEntries
          .map(
            ([name, desc]) =>
              `<div class="entry"><span class="name">${escapeHtml(name)}</span><span class="desc">${escapeHtml(desc)}</span></div>`
          )
          .join("\n")
      : `<p class="empty">No characters established yet.</p>`;

  const threadsHtml =
    openThreads.length > 0
      ? openThreads.map((t) => `<div class="thread">${escapeHtml(t)}</div>`).join("\n")
      : `<p class="empty">No open threads.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0d0b09;
    color: #c4b49a;
    font-family: "Courier New", Courier, monospace;
    font-size: 14px;
    line-height: 1.7;
    padding: 48px 24px 80px;
  }
  .container { max-width: 620px; margin: 0 auto; }
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
    font-size: 0.85em;
    color: #7a6e60;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    margin: 2em 0 1em;
  }
  .entry {
    display: flex;
    gap: 1.5em;
    padding: 0.6em 0;
    border-bottom: 1px solid #1a1815;
  }
  .name { color: #e8dcc8; min-width: 160px; flex-shrink: 0; }
  .desc { color: #8a7e6e; }
  .thread {
    padding: 0.6em 0 0.6em 1em;
    border-left: 2px solid #2a2520;
    color: #a89878;
    margin-bottom: 0.5em;
  }
  .thread::before { content: "— "; color: #4a4038; }
  .meta { color: #4a4038; font-size: 0.85em; margin-bottom: 2em; }
  .empty { color: #3a3530; font-style: italic; padding: 1em 0; }
</style>
</head>
<body>
<div class="container">
<h1>Character Sheet</h1>
<p class="meta">Chapter ${chapterCount} · ${charEntries.length} character${charEntries.length !== 1 ? "s" : ""} · ${openThreads.length} open thread${openThreads.length !== 1 ? "s" : ""}</p>
<h2>Cast</h2>
${charsHtml}
<h2>Open Threads</h2>
${threadsHtml}
</div>
</body>
</html>`;
}

export async function showCharacterSheet(context: vscode.ExtensionContext, root: string) {
  const state = await getStoryState(root);
  const html = buildHtml(state);

  const existing = panels.get(root);
  if (existing) {
    existing.webview.html = html;
    existing.reveal(vscode.ViewColumn.Beside);
    return;
  }

  const panel = vscode.window.createWebviewPanel(
    "noirCharacters",
    "Noir: Character Sheet",
    vscode.ViewColumn.Beside,
    { enableScripts: false }
  );
  panels.set(root, panel);
  panel.webview.html = html;
  panel.onDidDispose(
    () => {
      panels.delete(root);
    },
    null,
    context.subscriptions
  );
}
