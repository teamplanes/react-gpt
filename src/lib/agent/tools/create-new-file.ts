import dedent from 'dedent';
import {CodeTool, codeToolResponse} from './code-tool';
import {CodebaseRef} from '../types';

export const createCreateNewFileTool = (codebaseRef: CodebaseRef) => {
  return new CodeTool({
    name: 'create-new-file',
    description: dedent`
      Use this to create a new file, useful for creating new UI or functions.
      Please include the full contents of the file you'd like to create.
      Input should be the path to the file and the code as a string format:
      {{"path": "/src/file.js", "code": "..."}}
    `,
    parseInput: (input) => {
      if (!input) {
        throw new Error('No valid input provided');
      }
      const parsedInput = typeof input === 'object' ? input : JSON.parse(input);

      if (!parsedInput.path) {
        throw new Error('No path provided');
      }

      if (!parsedInput.code) {
        throw new Error('No code provided');
      }

      return parsedInput as {path: string; code: string};
    },
    func: async (input) => {
      // eslint-disable-next-line prefer-const
      let {path, code} = input;

      if (!path.endsWith('.js') && !path.endsWith('.jsx'))
        throw new Error(`Path must end with .js or .jsx`);

      if (!path.startsWith('/')) path = `/${path}`;

      if (codebaseRef.current.files[path]) {
        throw new Error(
          `File already exists at path "${path}", please use the update file tool instead.`,
        );
      }

      if (!path.startsWith('/src')) {
        throw new Error(`Path must start with /src`);
      }

      if (path === '/src/index.js') {
        throw new Error(
          `Path cannot be /src/index.js, please edit the /index.js file instead`,
        );
      }

      if (path === '/src/App.js') {
        throw new Error(
          `Path cannot be /src/App.js, please edit the /App.js file instead`,
        );
      }

      codebaseRef.current.onUpdateFiles({
        ...codebaseRef.current.files,
        [path]: {
          ...(codebaseRef.current.files[path] || {}),
          code,
        },
      });

      return codeToolResponse.success('File created successfully!');
    },
  });
};
