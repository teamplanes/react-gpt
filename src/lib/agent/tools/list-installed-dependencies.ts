import dedent from 'dedent';
import {CodeTool, codeToolResponse} from './code-tool';
import {CodebaseRef} from '../types';

export const createListInstalledDependenciesTool = (
  codebaseRef: CodebaseRef,
) => {
  return new CodeTool({
    name: 'list-installed-dependencies',
    description: dedent`
      Call this to get a list of all the dependencies in the project,
      useful to know which NPM modules you can import. Input should be an empty string.
    `,
    func: async () => {
      const deps = Object.entries(codebaseRef.current.dependencies || {})
        .map(([dependencyName]) => {
          return dependencyName;
        })
        .join('\n');

      return codeToolResponse.info(
        deps
          ? `Here is the list of installed dependencies:\n\n${deps}`
          : `No dependencies installed`,
      );
    },
  });
};
