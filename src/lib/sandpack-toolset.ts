/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import {DynamicTool} from 'langchain/tools';
import type {SandpackClient} from '@codesandbox/sandpack-client';
import {initialCodebaseState} from './initial-codebase-state';

export class SandpackToolset {
  constructor(private sandpackClient: SandpackClient) {
    this.sandpackClient = sandpackClient;
  }

  get tools() {
    return [
      this.createGetFileContentsByPathTool(),
      this.createListAvailableFilesTool(),
      this.createCreateNewFileTool(),
      this.createGetFilePathFormatInstructionsTool(),
      this.createSetFileContentsTool(),
      this.createListInstalledDependenciesTool(),
      this.createInstallDependencyTool(),
    ];
  }

  getFileCode(path: string) {
    return this.sandpackClient.sandboxSetup.files[path]?.code;
  }

  getInstalledDependencies() {
    return Object.entries(
      this.sandpackClient.sandboxSetup.dependencies ||
        initialCodebaseState.dependencies ||
        {},
    )
      .map(([dependencyName]) => {
        return dependencyName;
      })
      .join('\n');
  }

  private createListAvailableFilesTool() {
    return new DynamicTool({
      name: 'List Available Files',
      description:
        'call this to get a list of all the files in the project. input should be an empty string.',
      func: async () => {
        try {
          return `These are the files available in the project, all paths are relative to the root of the repository:\n${Object.entries(
            this.sandpackClient.sandboxSetup.files,
          )
            .map(([filePath]) => filePath)
            .join('\n')}`;
        } catch (error) {
          return `Failed to list files: ${error}`;
        }
      },
    });
  }

  private createGetFileContentsByPathTool() {
    return new DynamicTool({
      name: 'Get File Contents by Path',
      description:
        'call this to get the contents of a file. input should be the path to the file.',
      func: async (input) => {
        try {
          if (!input) {
            return `Error: no action_input provided. Please provide the path to the file you want to get the contents of.`;
          }

          input = input.trim();
          input = !input.startsWith('/') ? `/${input}` : input;

          const code = this.getFileCode(input);
          if (!code) {
            if (input && input.startsWith('/src')) {
              const cleanedInput = input.replace(/^\/src/, '');
              const codeAtCleanedPath = this.getFileCode(cleanedInput);

              if (codeAtCleanedPath) {
                return `Error: we couldn't find a file at the path you provided, but we did find one at the path ${cleanedInput}. Did you mean to use that path? If so, please try again.`;
              }
            }

            return `Error: file not found at path ${input}`;
          }
          return code;
        } catch (error) {
          return `Failed to get file: ${error}`;
        }
      },
    });
  }

  private createGetFilePathFormatInstructionsTool() {
    return new DynamicTool({
      name: 'Get File Path Format Instructions',
      description:
        'call this to get the instructions for how to format the path to a file. input should be an empty string.',
      func: async () => {
        return `The path should be formatted as follows:
- start with a forward slash (/)
- end with .js or .jsx
- the path should be relative to the project root
        `;
      },
    });
  }

  private createCreateNewFileTool() {
    return new DynamicTool({
      name: 'Create New File',
      description:
        'call this to create a new file. input should be the path to the file and the code as a string format: path,newCode',
      func: async (input) => {
        try {
          const [path, ...newCode] = input.split(',');

          if (!path.endsWith('.js') && !path.endsWith('.jsx'))
            return 'path must end with .js or .jsx';

          if (!path.startsWith('/')) return 'path must start with /';

          if (this.getFileCode(path)) {
            return `Error: file already exists at path <project-root>${path}, please use the update file tool instead.`;
          }

          this.sandpackClient.updateSandbox({
            ...this.sandpackClient.sandboxSetup,
            files: {
              ...this.sandpackClient.sandboxSetup.files,
              [path]: {
                code: newCode.join(','),
              },
            },
          });
          return 'file created successfully!';
        } catch (error) {
          return `Failed to create file: ${error}`;
        }
      },
    });
  }

  private createSetFileContentsTool() {
    return new DynamicTool({
      name: 'Set File Contents',
      description:
        'call this to set the contents of a file. input should be the path to the file and the code as a string format: path,newCode',
      func: async (input) => {
        try {
          const [path, ...newCode] = input.split(',');
          if (!path.endsWith('.js') && !path.endsWith('.jsx'))
            return 'Error: you may only update files that end with .js or .jsx';

          if (!this.getFileCode(path)) {
            return `Error: file does not exist at path <project-root>${path}, please use the create file tool instead, or try correcting the path.`;
          }

          this.sandpackClient.updateSandbox({
            ...this.sandpackClient.sandboxSetup,
            files: {
              ...this.sandpackClient.sandboxSetup.files,
              [path]: {
                code: newCode.join(','),
              },
            },
          });
          return 'file updated successfully!';
        } catch (error) {
          return `Failed to update file: ${error}`;
        }
      },
    });
  }

  private createListInstalledDependenciesTool() {
    return new DynamicTool({
      name: 'List Installed Dependencies',
      description:
        'call this to get a list of all the dependencies in the project. input should be an empty string.',
      func: async () => {
        try {
          return this.getInstalledDependencies() || 'No dependencies installed';
        } catch (error) {
          return `Failed to list dependencies: ${error}`;
        }
      },
    });
  }

  private createInstallDependencyTool() {
    return new DynamicTool({
      name: 'Install Dependency',
      description:
        'call this to install a new dependency. input should be the name of the dependency.',
      func: async (input) => {
        if (this.sandpackClient.sandboxSetup.dependencies?.[input]) {
          return `Error: ${input} is already installed`;
        }
        return `This tool is not yet supported. Therefore you will not be able to use ${input}. Please use one of the installed dependencies: ${this.getInstalledDependencies()}`;
      },
    });
  }
}
