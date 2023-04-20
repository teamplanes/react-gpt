import dedent from 'dedent';
import {CodeTool, codeToolResponse} from './code-tool';
import {CodebaseRef} from '../types';

export const createListAvailableFilesTool = (codebaseRef: CodebaseRef) =>
  new CodeTool({
    name: 'list-available-files',
    description: dedent`
      Use this tool to get a list of all the files in the project to
      understand the file structure. Input should be an empty string.
    `,
    func: async () => {
      const allFiles = Object.entries(codebaseRef.current.files).map(
        ([filePath]) => filePath,
      );
      const hasSrcFolder = allFiles.some((filePath) =>
        filePath.startsWith('/src'),
      );

      return codeToolResponse.info(dedent`
        These are the files available in the project, these are all relative to your working directory, i.e. the root of the repository:
        ${allFiles.join('\n')}

        You can set new content for any of these files, or create a new one if you need.

        ${
          !hasSrcFolder
            ? `Note: the /src folder has not been created yet, however you do not need to create it explicitly.`
            : ''
        }
      `);
    },
  });
