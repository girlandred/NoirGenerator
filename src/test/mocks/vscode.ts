export const workspace = {
  workspaceFolders: undefined as any,
  getConfiguration: (_section?: string) => ({
    get: (_key: string, defaultValue?: unknown) => defaultValue,
    update: async (_key: string, _value: unknown) => { },
  }),
  fs: {
    readFile: async (_uri: any): Promise<Uint8Array> => new Uint8Array(),
    writeFile: async (_uri: any, _content: Uint8Array): Promise<void> => { },
  },
  textDocuments: [] as any[],
  onDidChangeConfiguration: (_listener: any) => ({ dispose: () => { } }),
  createFileSystemWatcher: (_pattern: any) => ({
    onDidChange: (_listener: any) => ({ dispose: () => { } }),
    onDidCreate: (_listener: any) => ({ dispose: () => { } }),
    dispose: () => { },
  }),
};

export const window = {
  showErrorMessage: async (_message: string, ..._items: string[]) => undefined as any,
  showInformationMessage: async (_message: string, ..._items: string[]) => undefined as any,
  showInputBox: async (_options?: any) => undefined as any,
  withProgress: async (_options: any, task: (progress: any) => Promise<any>) =>
    task({ report: (_value: any) => { } }),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, scheme: "file" }),
};

export const commands = {
  registerCommand: (_command: string, _callback: any) => ({ dispose: () => { } }),
};

export const ProgressLocation = { Notification: 15, SourceControl: 1, Window: 10 };
export const ConfigurationTarget = { Global: 1, Workspace: 2, WorkspaceFolder: 3 };
