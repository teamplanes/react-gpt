type Ext = 'js' | 'jsx';

interface CodebaseFile {
  path: `/${string}.${Ext}`;
  code: string;
  editor?: {
    isActive?: boolean;
    isHidden?: boolean;
  };
}

export interface CodebaseState {
  files: CodebaseFile[];
  dependencies: Record<string, string>;
}
