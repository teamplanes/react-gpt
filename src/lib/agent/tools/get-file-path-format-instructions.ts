import dedent from 'dedent';
import {CodeTool, codeToolResponse} from './code-tool';

export const createGetFilePathFormatInstructionsTool = () => {
  return new CodeTool({
    name: 'get-file-path-format-instructions',
    description:
      'Use this to get the instructions for how to format the path to a file. Input should be an empty string.',
    func: async () => {
      return codeToolResponse.info(dedent`
        The path should be formatted as follows:
          - start with a forward slash (/)
          - end with .js
          - please follow good file naming conventions, for example: /src/components/MyComponent.js
          - if you are creating a new file, please make sure to create it in the /src folder
          - there are only 2 files in the root of the project '/App.js' and '/index.js', please do not create new files in the root of the project
      `);
    },
  });
};
