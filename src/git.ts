import * as cp from "child_process";
import * as path from "path";
import * as vscode from "vscode";

export interface CommitData {
  hash: string;
  message: string;
  author: string;
  date: string;
  diffSummary: string;
}

export interface StoryState {
  chapters: { hash: string; chapter: string; date: string }[];
  lastProcessedHash: string | null;
  chapterCount: number;
  previousSummary: string;
  characters: Record<string, string>;
  openThreads: string[];
}

const SEP = "\x1E";

function runFile(file: string, args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cp.execFile(file, args, { cwd, maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{40}$/.test(hash);
}

export async function getLastCommit(repoPath: string): Promise<CommitData | null> {
  try {
    const [log, stat] = await Promise.all([
      runFile(
        "git",
        ["log", "-1", `--pretty=format:%H${SEP}%s${SEP}%an${SEP}%ad`, "--date=format:%Y-%m-%d"],
        repoPath
      ),
      runFile("git", ["show", "--stat", "--no-commit-id", "HEAD"], repoPath).catch(() => ""),
    ]);

    const [hash, message, author, date] = log.split(SEP);
    if (!isValidHash(hash)) {
      return null;
    }

    const lines = stat.split("\n").filter(Boolean);
    const diffSummary =
      lines.length > 0
        ? [...lines.slice(0, Math.min(8, lines.length - 1)), lines[lines.length - 1]].join("\n")
        : "No diff available.";

    return { hash, message, author, date, diffSummary };
  } catch {
    return null;
  }
}

function stateFilePath(repoPath: string): vscode.Uri {
  return vscode.Uri.file(path.join(repoPath, ".noir-commits-state.json"));
}

export function isValidState(data: unknown): data is StoryState {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return false;
  }
  const s = data as Record<string, unknown>;
  return (
    Array.isArray(s.chapters) &&
    (s.lastProcessedHash === null || typeof s.lastProcessedHash === "string") &&
    typeof s.chapterCount === "number" &&
    typeof s.previousSummary === "string" &&
    typeof s.characters === "object" &&
    !Array.isArray(s.characters) &&
    s.characters !== null &&
    Array.isArray(s.openThreads)
  );
}

export async function getStoryState(repoPath: string): Promise<StoryState> {
  try {
    const raw = await vscode.workspace.fs.readFile(stateFilePath(repoPath));
    const parsed = JSON.parse(new TextDecoder().decode(raw), (key, value) => {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        return undefined;
      }
      return value;
    });
    if (!isValidState(parsed)) {
      throw new Error("Invalid state shape");
    }
    return parsed;
  } catch {
    return {
      chapters: [],
      lastProcessedHash: null,
      chapterCount: 0,
      previousSummary: "",
      characters: {},
      openThreads: [],
    };
  }
}

export async function saveStoryState(repoPath: string, state: StoryState): Promise<void> {
  await vscode.workspace.fs.writeFile(
    stateFilePath(repoPath),
    new TextEncoder().encode(JSON.stringify(state, null, 2))
  );
}
