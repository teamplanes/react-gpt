import {SandpackFile} from '@codesandbox/sandpack-react';
import {MutableRefObject} from 'react';

export interface Codebase {
  dependencies: Record<string, string>;
  files: Record<string, SandpackFile>;
  onUpdateFiles: (files: Record<string, SandpackFile>) => void;
  onUpdateDependencies: (dependencies: Record<string, string>) => void;
}

export type CodebaseRef = MutableRefObject<Codebase>;

export interface Task {
  task_id: number;
  task_name: string;
  tool_input: string;
  tool_name: string;
}
