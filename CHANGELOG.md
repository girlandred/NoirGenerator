# Changelog

## [0.2.2] — 2026-04-06

### Fixed

- Story panel and character sheet used a single global panel instance, causing content from one workspace root to appear in a panel opened for another. Each workspace root now owns its own panel.
- API 429 (rate limit) responses now surface a human-readable message instead of the generic `API error 429`.

### Improved

- `story.md` file watcher added to the story preview panel — external edits to the file now refresh the panel immediately without requiring a chapter write.

## [0.2.1] — 2026-04-04

### Added

- **Detective name** (`Noir Commits: Set Detective Name`) — set a personal alias used as your character's name in the story. Your real git author name is never sent to any AI provider
- **Onboarding walkthrough** — first activation prompts provider choice, data disclosure, and detective name instead of silently waiting for a commit

### Improved

- **Fewer API calls per commit** — character and thread metadata is now extracted in the same call as chapter generation (down from 3 calls to 1–2 per commit)
- **`max_tokens` tuned** — chapter generation budget reduced from 1000 to 600 tokens, matching actual output length (150–300 words)

### Privacy & Compliance

- Git author names are no longer sent to any AI provider — replaced by the user's chosen detective alias
- `story.md` now includes an HTML comment header disclosing that content is AI-generated and what data was used
- Story preview panel shows an "AI-generated content" badge and a link to report issues

## [0.2.0]

### Added

- **Story preview panel** — dedicated webview with dark noir theme (Courier New, amber text) renders chapters instead of opening the raw `.md` file
- **Character sheet** (`Noir Commits: Show Character Sheet`) — webview showing the full cast and open plot threads accumulated across chapters
- **Model selector** — choose between Claude Haiku (fast, cheap) and Claude Sonnet (richer prose) via `noirCommits.model` in settings
- **Toggle auto-trigger command** (`Noir Commits: Toggle Auto-Generate After Commit`) — enable/disable auto-generation from the command palette without opening settings; watcher starts/stops immediately without requiring a reload
- **Skip commit command** (`Noir Commits: Skip Current Commit`) — marks the current commit as processed without writing a chapter, preventing the next auto-trigger from generating one for it
- Chapters are now written to `story.md` in the workspace root with chapter number and date headers (`*Chapter N — YYYY-MM-DD*`), separated by `---`

### Fixed

- Previous chapters were not persisted to disk — story file is now appended, not overwritten
- Auto-trigger watcher only applied at activation; toggling `noirCommits.autoTrigger` in settings now takes effect immediately
- Commit fields (message, author, date) were misread when a commit message contained `||` — separator replaced with ASCII Record Separator `\x1E`
- `git log` previously used shell-interpolated `exec`; migrated to `execFile` to eliminate shell injection risk
- Rapid commits with auto-trigger enabled could race on state read/write — concurrency guard added

### Testing

- Added full unit test suite (`mocha` + `sinon` + `ts-node`) covering `api`, `generator`, `git`, `summarizer`, and `utils` modules — 76 tests, all passing
- Added VS Code integration test suite (`@vscode/test-electron`) covering command registration, configuration round-trips, and story state persistence against the real VS Code filesystem API

### Improved

- `git log` and `git show --stat` now run in parallel
- `saveStoryState` and `story.md` write now run in parallel
- Shared `escapeHtml`, `formatCharacters`, `formatThreads`, `requireWorkspaceRoot`, and `getNoirConfig` utilities eliminate duplication across modules
- HTML escaping in story panel now applies per-block after structural parsing, fixing fragile escape ordering
- Character sheet reuses its panel on repeat invocations instead of creating a new one each time

## [0.1.0] — Initial Release

- Generate noir story chapters from git commits via Claude AI
- Persistent story state: characters, open plot threads, and chapter history
- Narrative summarization to maintain context across long stories
- Auto-trigger mode: write a chapter automatically after each commit
- Prompt caching for reduced API latency and cost
