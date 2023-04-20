import dedent from 'dedent';
import {CodeTool, codeToolResponse} from './code-tool';
import {CodebaseRef} from '../types';

export const createSetFileContentsTool = (codebaseRef: CodebaseRef) => {
  return new CodeTool({
    name: 'set-file-contents',
    description: dedent`
      Use this to set the entire contents of a file, useful for updating a file with new code.
      Be sure to plan to read the contents of the file before overwriting it.
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
        throw new Error(`You may only update files that end with .js or .jsx`);

      if (!path.startsWith('/')) path = `/${path}`;

      if (path && path.startsWith('/src')) {
        const cleanedInput = path.replace(/^\/src/, '');
        const codeAtCleanedPath = codebaseRef.current.files[cleanedInput]?.code;

        if (codeAtCleanedPath) {
          throw new Error(
            dedent`
                We couldn't find a file at the path you provided, but we did find one at the path ${cleanedInput}.
                Did you mean to use that path? If so, please try again.`,
          );
        }
      }

      if (!codebaseRef.current.files[path]?.code) {
        throw new Error(
          dedent`
              File does not exist at path ${path}, please use the create
              file tool instead, or try correcting the path.
            `,
        );
      }

      codebaseRef.current.onUpdateFiles({
        ...codebaseRef.current.files,
        [path]: {
          ...(codebaseRef.current.files[path] || {}),
          code,
        },
      });

      return codeToolResponse.success('File updated successfully!');
    },
  });
};
