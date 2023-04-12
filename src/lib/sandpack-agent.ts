import {initializeAgentExecutor} from 'langchain/agents';
import {OpenAIChat} from 'langchain/llms/openai';
import {CallbackManager} from 'langchain/callbacks';
import type {SandpackError} from '@codesandbox/sandpack-client';
import {SandpackToolset} from './sandpack-toolset';

const VERBOSE = true;

interface ExecutorOptions {
  onNewToken: (token: string) => void;
}

const getExecutor = async (
  sandpackToolset: SandpackToolset,
  options?: ExecutorOptions,
) => {
  const handleLLMNewToken = options?.onNewToken;

  const chat = new OpenAIChat(
    {
      openAIApiKey: 'thisisnotthekey',
      temperature: 0.4,
      verbose: VERBOSE,
      streaming: true,
      callbackManager: handleLLMNewToken
        ? CallbackManager.fromHandlers({
            async handleLLMNewToken(t: string) {
              handleLLMNewToken(t);
            },
          })
        : undefined,
    },
    {basePath: '/openai'},
  );

  const executor = await initializeAgentExecutor(
    sandpackToolset.tools,
    chat,
    'chat-zero-shot-react-description',
    VERBOSE,
  );

  return executor;
};

export const executeSandpackAgent = async (
  instruction: string,
  sandpackToolset: SandpackToolset,
  options?: ExecutorOptions,
) => {
  const executor = await getExecutor(sandpackToolset, options);

  return executor.call({
    input: `You are a Senior React.js Engineer working on a JavaScript (not TypeScript) create-react-app project. You should follow these guidelines:
- All UI work should use Chakra UI, however you can install any supplementary dependencies if you need.
- The project already has the following dependencies installed: ${sandpackToolset.getInstalledDependencies()}.
- The UI entrypoint is at /App.js, so make sure you update this file iff needed!
- You do not need to write tests.
- You can create new Component, React Hooks, or any other JavaScript files as needed.

Please update the codebase using the following instruction: "${instruction}".`,
  });
};

export const executeSandpackFixerAgent = async (
  error: SandpackError,
  sandpackToolset: SandpackToolset,
  options?: ExecutorOptions,
) => {
  const executor = await getExecutor(sandpackToolset, options);

  return executor.call({
    input: `You are a Senior React.js Engineer working on a fix within a JavaScript (not TypeScript) create-react-app project. You should follow these guidelines:
- All UI work should use Chakra UI, however you can install any supplementary dependencies if you need.
- The project already has the following dependencies installed: ${sandpackToolset.getInstalledDependencies()}.
- The UI entrypoint is at /App.js, so make sure you update this file iff needed!
- You do not need to write tests.
- You can create new Component, React Hooks, or any other JavaScript files as needed.

${
  error.path
    ? `The error is in the file ${error.path}, on line ${error.line}. `
    : ''
}The error message is: ${error.message}`,
  });
};
