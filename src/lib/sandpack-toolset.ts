/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
import {DynamicTool} from 'langchain/tools';
import {SandpackFile} from '@codesandbox/sandpack-react';
import {useRef} from 'react';

export interface SandpackToolsetOptions {
  dependencies: Record<string, string>;
  files: Record<string, SandpackFile>;
  onUpdateFiles: (files: Record<string, SandpackFile>) => void;
  onUpdateDependencies: (dependencies: Record<string, string>) => void;
}

export interface SandpackToolset {
  tools: DynamicTool[];
  getInstalledDependencies: () => string;
  getFileCode: (path: string) => string | undefined;
}

export const useSandpackToolset = (
  options: SandpackToolsetOptions,
): SandpackToolset => {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const getFileCode = (path: string) => {
    return optionsRef.current.files[path]?.code;
  };

  const getInstalledDependencies = () => {
    return Object.entries(optionsRef.current.dependencies || {})
      .map(([dependencyName]) => {
        return dependencyName;
      })
      .join('\n');
  };

  const createListAvailableFilesTool = () => {
    return new DynamicTool({
      name: 'List Available Files',
      description:
        'call this to get a list of all the files in the project. input should be an empty string.',
      func: async () => {
        try {
          return `These are the files available in the project, all paths are relative to the root of the repository:\n${Object.entries(
            optionsRef.current.files,
          )
            .map(([filePath]) => filePath)
            .join(
              '\n',
            )}\nYou can set new content for any of these files, or create a new one if you need.`;
        } catch (error) {
          return `Failed to list files: ${error}`;
        }
      },
    });
  };

  const createGetFileContentsByPathTool = () => {
    return new DynamicTool({
      name: 'Get File Contents by Path',
      description:
        'call this to get the contents of a file, useful to if you want to make a change to it. input should be the path to the file.',
      func: async (input) => {
        try {
          if (!input) {
            return `Error: no action_input provided. Please provide the path to the file you want to get the contents of.`;
          }

          input = input.trim();
          input = !input.startsWith('/') ? `/${input}` : input;

          const code = getFileCode(input);
          if (!code) {
            if (input && input.startsWith('/src')) {
              const cleanedInput = input.replace(/^\/src/, '');
              const codeAtCleanedPath = getFileCode(cleanedInput);

              if (codeAtCleanedPath) {
                return `Error: we couldn't find a file at the path you provided, but we did find one at the path ${cleanedInput}. Did you mean to use that path? If so, please try again.`;
              }
            }

            return `Error: file not found at path ${input}, please use the list available files tool to see all available files`;
          }
          return code;
        } catch (error) {
          return `Failed to get file: ${error}`;
        }
      },
    });
  };

  const createGetFilePathFormatInstructionsTool = () => {
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
  };

  const createCreateNewFileTool = () => {
    return new DynamicTool({
      name: 'Create New File',
      description: `call this to create a new file, useful for creating new UI or functions. input should be the path to the file and the code as a string format: {{"path": "path/to/file.js", "code": "console.log('')}}`,
      func: async (input) => {
        console.log('Create New File:', input);
        try {
          // eslint-disable-next-line prefer-const
          let {path, code} = JSON.parse(input);

          if (!path.endsWith('.js') && !path.endsWith('.jsx'))
            return `path must end with .js or .jsx, received ${path}`;

          if (!path.startsWith('/')) path = `/${path}`;

          if (getFileCode(path)) {
            return `Error: file already exists at path <project-root>${path}, please use the update file tool instead.`;
          }

          optionsRef.current.onUpdateFiles({
            ...optionsRef.current.files,
            [path]: {
              ...(optionsRef.current.files[path] || {}),
              code,
            },
          });

          return 'file created successfully!';
        } catch (error) {
          return `Failed to create file: ${error}`;
        }
      },
    });
  };

  const createSetFileContentsTool = () => {
    return new DynamicTool({
      name: 'Set File Contents',
      description:
        'call this to set the contents of a file, useful for updating a file with new code. input should be the path to the file and the code as a string format: {{"path": "path/to/file.js", "code": "console.log()}}',
      func: async (input) => {
        console.log('Set File Contents:', input);
        try {
          // eslint-disable-next-line prefer-const
          let {path, code} = JSON.parse(input);
          if (!path.endsWith('.js') && !path.endsWith('.jsx'))
            return `Error: you may only update files that end with .js or .jsx, received ${path}`;

          if (path && path.startsWith('/src')) {
            const cleanedInput = path.replace(/^\/src/, '');
            const codeAtCleanedPath = getFileCode(cleanedInput);

            if (codeAtCleanedPath) {
              return `Error: we couldn't find a file at the path you provided, but we did find one at the path ${cleanedInput}. Did you mean to use that path? If so, please try again.`;
            }
          }

          if (!getFileCode(path)) {
            return `Error: file does not exist at path <project-root>${path}, please use the create file tool instead, or try correcting the path.`;
          }

          optionsRef.current.onUpdateFiles({
            ...optionsRef.current.files,
            [path]: {
              ...(optionsRef.current.files[path] || {}),
              code,
            },
          });
          return 'file updated successfully!';
        } catch (error) {
          return `Failed to update file: ${error}`;
        }
      },
    });
  };

  const createListInstalledDependenciesTool = () => {
    return new DynamicTool({
      name: 'List Which Dependencies Are Installed',
      description:
        'call this to get a list of all the dependencies in the project, useful to know which NPM modules you can import. input should be an empty string.',
      func: async () => {
        try {
          return getInstalledDependencies()
            ? `Here is the list of installed dependencies:\n\n${getInstalledDependencies()}`
            : 'No dependencies installed';
        } catch (error) {
          return `Failed to list dependencies: ${error}`;
        }
      },
    });
  };

  const createInstallDependencyTool = () => {
    return new DynamicTool({
      name: 'Install Dependency',
      description:
        'call this to install a new dependency. input should be the name of the dependency.',
      func: async (input) => {
        if (optionsRef.current.dependencies?.[input]) {
          return `Error: ${input} is already installed, it does not need to be installed again.`;
        }
        optionsRef.current.onUpdateDependencies({
          ...optionsRef.current.dependencies,
          [input]: 'latest',
        });
        return `Successfully installed npm package "${input}", you can now use in the project.`;
      },
    });
  };

  return {
    getInstalledDependencies,
    getFileCode,
    tools: [
      createGetFileContentsByPathTool(),
      createListAvailableFilesTool(),
      createCreateNewFileTool(),
      createGetFilePathFormatInstructionsTool(),
      createSetFileContentsTool(),
      createListInstalledDependenciesTool(),
      createInstallDependencyTool(),
    ],
  };
};
