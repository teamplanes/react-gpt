import type {SandpackError} from '@codesandbox/sandpack-client';
import {SandpackToolset} from './sandpack-toolset';
import {BabyAGI} from './babyagi';

export const executeSandpackAgent = async (
  agi: BabyAGI,
  instruction: string,
) => {
  await agi.call({
    objective: `Complete this task in the React.js codebase "${instruction}".`,
  });
};

export const executeSandpackFixerAgent = async (
  agi: BabyAGI,
  error: SandpackError,
  sandpackToolset: SandpackToolset,
) => {
  await agi.call({
    input: `You are a Senior React.js Engineer working on a fix within a JavaScript (not TypeScript) create-react-app project. You should follow these guidelines:
- All UI work should use Chakra UI, however you can install any supplementary dependencies if you need.
- The project already has the following dependencies installed: ${sandpackToolset.getInstalledDependencies()}.
- The UI entrypoint is at /App.js, so make sure you update this file if needed!
- You do not need to write tests.
- You can create new Component, React Hooks, or any other JavaScript files as needed.
- You should complete 1 action at a time.
- Be sure to progress through steps without repeating previous steps if they completed successfully.

${
  error.path
    ? `The error is in the file ${error.path}, on line ${error.line}. `
    : ''
}The error message is: ${error.message}`,
  });
};
