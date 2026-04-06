interface FakeUri {
  fsPath: string;
  scheme: string;
}

interface FakeDisposable {
  dispose: () => void;
}

interface FakeProgress {
  report: (_value: { message?: string }) => void;
}

export const workspace = {
  workspaceFolders: undefined as { uri: FakeUri; name: string }[] | undefined,
  getConfiguration: (_section?: string) => ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
    update: async (_key: string, _value: unknown) => {},
  }),
  fs: {
    readFile: async (_uri: FakeUri): Promise<Uint8Array> => new Uint8Array(),
    writeFile: async (_uri: FakeUri, _content: Uint8Array): Promise<void> => {},
  },
  textDocuments: [] as { uri: FakeUri; isDirty: boolean; save: () => Promise<void> }[],
  onDidChangeConfiguration: (_listener: () => void): FakeDisposable => ({ dispose: () => {} }),
  createFileSystemWatcher: (_pattern: string | { base: string; pattern: string }) => ({
    onDidChange: (_listener: () => void): FakeDisposable => ({ dispose: () => {} }),
    onDidCreate: (_listener: () => void): FakeDisposable => ({ dispose: () => {} }),
    dispose: () => {},
  }),
};

export const window = {
  showErrorMessage: async (_message: string, ..._items: string[]): Promise<string | undefined> => undefined,
  showInformationMessage: async (_message: string, ..._items: string[]): Promise<string | undefined> => undefined,
  showInputBox: async (_options?: { title?: string; prompt?: string; password?: boolean; ignoreFocusOut?: boolean; placeHolder?: string; value?: string; validateInput?: (v: string) => string | null }): Promise<string | undefined> => undefined,
  withProgress: async <T>(
    _options: { location: number; title?: string; cancellable?: boolean },
    task: (progress: FakeProgress) => Promise<T>
  ): Promise<T> => task({ report: () => {} }),
};

export const Uri = {
  file: (path: string): FakeUri => ({ fsPath: path, scheme: "file" }),
};

export const commands = {
  registerCommand: (_command: string, _callback: (...args: unknown[]) => unknown): FakeDisposable => ({ dispose: () => {} }),
  executeCommand: async (_command: string, ..._args: unknown[]): Promise<unknown> => undefined,
};

export const ProgressLocation = { Notification: 15, SourceControl: 1, Window: 10 };
export const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
