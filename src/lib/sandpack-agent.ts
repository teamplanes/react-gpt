import {AgentExecutor, ChatAgent, ZeroShotAgent} from 'langchain/agents';
import {OpenAIChat} from 'langchain/llms/openai';
import {CallbackManager} from 'langchain/callbacks';
import type {SandpackError} from '@codesandbox/sandpack-client';
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  SystemMessagePromptTemplate,
} from 'langchain/prompts';
import {LLMChain} from 'langchain';
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
      temperature: 0.8,
      verbose: true,
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

  const prompt = ZeroShotAgent.createPrompt(sandpackToolset.tools, {
    prefix: `You are an AI agent capable of completing coding tasks in a React.js codebase. You must follow these guidelines:
- All UI work should use Chakra UI, which is already installed.
- It is unlikely you will need to install any additional dependencies.
- Please only give me the next step/action.
- You may only update JS files.
- You may need to make an edit to "App.js" (in the root of the repository) to complete the challenge.
- File manipulation can be done using the tool provided.
- The project already has the following dependencies installed:\n${sandpackToolset.getInstalledDependencies()}

You need to perform a sequence of actions to complete a task using ONLY the following tools:`,
    // suffix: `Begin!`,
  });

  const chatPrompt = ChatPromptTemplate.fromPromptMessages([
    new SystemMessagePromptTemplate(prompt),
    HumanMessagePromptTemplate.fromTemplate(`{input}

This was your previous work (but I haven't seen any of it! I only see what you return as final answer):
{agent_scratchpad}`),
  ]);

  const llmChain = new LLMChain({
    prompt: chatPrompt,
    llm: chat,
    verbose: VERBOSE,
  });

  const agent = new ZeroShotAgent({
    llmChain,
    allowedTools: sandpackToolset.tools.map((tool) => tool.name),
  });

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    verbose: VERBOSE,
    tools: sandpackToolset.tools,
  });

  return executor;
};

export const executeSandpackAgent = async (
  instruction: string,
  sandpackToolset: SandpackToolset,
  options?: ExecutorOptions,
) => {
  const executor = await getExecutor(sandpackToolset, options);

  return executor.call({
    input: `Work through the following React.js coding challenge "${instruction}". The guidelines are:


THE CODING CHALLENGE:
Your coding challenge is "${instruction}".

There are no additional instructions for the challenge, please begin solving the problem.`,
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
