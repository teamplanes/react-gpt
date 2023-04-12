import {initialCodebaseState} from '../initial-codebase-state';
import {CodebaseState} from './types';

export class Codebase {
  constructor(public state: CodebaseState = initialCodebaseState) {
    this.state = state;
  }

  getFile(filePath: string) {
    return this.state.files.find((file) => file.path === filePath);
  }

  getActiveFile() {
    return this.state.files.find((file) => file.editor?.isActive);
  }

  listFilePaths() {
    return this.state.files.map((file) => file.path);
  }

  listDependencies() {
    return Object.entries(this.state.dependencies).map(([name, version]) => ({
      name,
      version,
    }));
  }

  updateFile(filePath: string, code: string) {
    const file = this.getFile(filePath);
    if (file) {
      file.code = code;
    } else {
      throw new Error(`File not found: ${filePath}`);
    }
  }

  createFile(filePath: `/${string}.js` | `/${string}.jsx`, code: string) {
    if (this.getFile(filePath)) {
      throw new Error(`File already exists: ${filePath}`);
    }
    this.state.files.push({
      path: filePath,
      code,
    });
  }

  installDependency(name: string) {
    this.state.dependencies[name] = 'latest';
  }
}
