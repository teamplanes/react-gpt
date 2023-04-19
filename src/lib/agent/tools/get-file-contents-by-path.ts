/* eslint-disable no-param-reassign */
import dedent from 'dedent';
import {MutableRefObject} from 'react';
import {CodeTool, codeToolResponse} from './code-tool';
import {Codebase} from '../types';

export const createGetFileContentsByPathTool = (
  sandpackToolsetOptions: MutableRefObject<Codebase>,
) => {
  return new CodeTool<string>({
    name: 'get-file-contents-by-path',
    description: dedent`
      Use this tool to view the contents of a file, you should use this before making a change to it.
      Input should a string of the path to the file you want to get the contents of.
    `,
    func: async (input) => {
      if (!input) {
        throw new Error(
          dedent`
            no action_input provided.
            Please provide the path to the file you want to get the contents of.
          `,
        );
      }

      if (typeof input !== 'string') {
        throw new Error(
          dedent`
            action_input provided is not a string.
            Please provide the path to the file you want to get the contents of.
          `,
        );
      }

      input = input.trim();
      input = !input.startsWith('/') ? `/${input}` : input;

      const code = sandpackToolsetOptions.current.files[input]?.code;
      if (!code) {
        if (input && input.startsWith('/src')) {
          const cleanedInput = input.replace(/^\/src/, '');
          const codeAtCleanedPath =
            sandpackToolsetOptions.current.files[cleanedInput]?.code;

          if (codeAtCleanedPath) {
            throw new Error(
              dedent`
                we couldn't find a file at the path you provided, but we did find one at the path ${cleanedInput}.
                Did you mean to use that path? If so, please try again.`,
            );
          }
        }

        throw new Error(
          dedent`
            we couldn't find a file at the path you provided.
            Please make sure you are using the correct path.
          `,
        );
      }

      return codeToolResponse.info(
        dedent`
          code found in file at path "${input}":
          \`\`\`js
          ${code}
          \`\`\`
        `,
      );
    },
  });
};
