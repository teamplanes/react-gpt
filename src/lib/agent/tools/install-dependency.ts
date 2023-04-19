import dedent from 'dedent';
import {MutableRefObject} from 'react';
import {CodeTool, codeToolResponse} from './code-tool';
import {Codebase} from '../types';

export const createInstallDependencyTool = (
  sandpackToolsetOptions: MutableRefObject<Codebase>,
) => {
  return new CodeTool<string>({
    name: 'install-dependency',
    description: dedent`
      Call this to install a new dependency.
      Input should be the name of the dependency.
    `,
    func: async (input) => {
      if (!input) {
        throw new Error(`Input must be provided`);
      }

      const multipleInputs = input.split(' ');

      if (multipleInputs.length > 1) {
        const alreadyInstalledDeps = multipleInputs.filter((dep) => {
          return !!sandpackToolsetOptions.current.dependencies?.[dep];
        });

        if (alreadyInstalledDeps.length) {
          const deps = alreadyInstalledDeps.join(' & ');
          throw new Error(dedent`
            Multiple errors:
              - ${deps} are already installed, they do not need to be installed again.
              - You may only install one dependency at a time.
          `);
        }

        throw new Error(`You may only install one dependency at a time.`);
      }

      if (sandpackToolsetOptions.current.dependencies?.[input]) {
        throw new Error(
          `${input} is already installed, it does not need to be installed again.`,
        );
      }

      sandpackToolsetOptions.current.onUpdateDependencies({
        ...sandpackToolsetOptions.current.dependencies,
        [input]: 'latest',
      });

      return codeToolResponse.success(
        `Successfully installed npm package "${input}", you can now use in the project.`,
      );
    },
  });
};
