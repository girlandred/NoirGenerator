# Noir Commits

> *Every commit tells a story. This one wears a trench coat.*

**Noir Commits** is a VS Code extension that reads your git commits and generates a living **noir detective novel** — chapter by chapter — powered by Claude AI.

Your developers become detectives. Your bugs become crimes. Your refactors become late-night re-examinations of cold case files.

## Features

- Generates a new noir story chapter from each git commit
- Maintains narrative continuity — characters, open threads, and story arcs persist across chapters
- Maps commit types to noir events: bugs are crimes, features are new leads, fixes close cases
- Auto-trigger mode writes a chapter automatically after every commit
- **Story preview panel** — dedicated dark-themed webview renders your story in noir style
- **Character sheet** — tracks the full cast and open plot threads accumulated across chapters
- **Model selector** — choose between Claude Haiku (fast, economical) and Claude Sonnet (richer prose)

![Noir Commits example](https://raw.githubusercontent.com/girlandred/NoirGenerator/main/NoirExample.jpg)

## Requirements

An [Anthropic API key](https://console.anthropic.com) is required. Usage is billed to your Anthropic account.

## Getting Started

1. Install the extension
2. Run **Noir Commits: Set API Key** from the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
3. Paste your Anthropic API key — it is stored securely in the OS keychain, never in plaintext
4. Open a git repository and run **Noir Commits: Write Next Chapter**

The chapter opens in the story preview panel. Chapters are also written to `story.md` in your workspace root.

## Commands

| Command | Description |
| --- | --- |
| `Noir Commits: Write Next Chapter` | Generate a chapter from the latest commit |
| `Noir Commits: Skip Current Commit` | Mark the latest commit as processed without writing a chapter |
| `Noir Commits: Open Story Preview` | Open the noir-themed story panel |
| `Noir Commits: Show Character Sheet` | View the full cast and open plot threads |
| `Noir Commits: Toggle Auto-Generate After Commit` | Enable or disable auto-generation after each commit |
| `Noir Commits: Set API Key` | Store your Anthropic API key securely |
| `Noir Commits: Remove API Key` | Delete the stored API key |

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `noirCommits.model` | `claude-haiku-4-5-20251001` | Model used for generation — Haiku (fast, cheap) or Sonnet (richer prose) |
| `noirCommits.autoTrigger` | `false` | Automatically write a chapter after each commit |
| `noirCommits.projectDescription` | `""` | A short project description used as narrative backdrop |

## Privacy

- Your API key is stored in the VS Code SecretStorage (OS keychain) — never written to disk or sent anywhere except the Anthropic API
- Story state is saved to `.noir-commits-state.json` in your workspace root — add it to `.gitignore` to keep your story private
- Commit messages, author names, and diff stats are sent to the Anthropic API to generate story text

---

*The city doesn't care about your sprint velocity. But it remembers every commit.*
