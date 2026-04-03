# Changelog

## [0.2.0] — Unreleased

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
