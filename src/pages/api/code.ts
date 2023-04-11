/* eslint-disable no-console */
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {OpenAIChat} from 'langchain/llms/openai';
import {initializeAgentExecutor} from 'langchain/agents';
import {DynamicTool} from 'langchain/tools';
import {Codebase} from '@/lib/codebase';
import {CallbackManager} from 'langchain/callbacks';
import {NextRequest} from 'next/server';

let currentState = 'NONE';
let partialToken = '';

function processToken(token: string, callback: (text: string) => void) {
  partialToken += token;

  // log partialToken in green
  console.log(`\x1b[32m${partialToken}\x1b[0m`);

  switch (currentState) {
    case 'NONE':
      if (partialToken.includes('Question:')) {
        callback('QUESTION');
        currentState = 'QUESTION';
        partialToken = '';
      } else if (partialToken.includes('Thought:')) {
        callback('THOUGHT');
        currentState = 'THOUGHT';
        partialToken = '';
      } else if (partialToken.includes('Action:')) {
        callback('ACTION');
        currentState = 'ACTION';
        partialToken = '';
      }
      break;
    case 'QUESTION':
      if (token.includes('\n')) {
        currentState = 'NONE';
        partialToken = '';
      }
      callback(token);

      break;
    case 'THOUGHT':
      if (token.includes('\n')) {
        currentState = 'NONE';
        partialToken = '';
      }
      callback(token);

      break;
    case 'ACTION': {
      const actionEnd = partialToken?.trim()?.split('```')?.[1];

      let actionType: string;
      try {
        actionType = JSON.parse(actionEnd)?.action;
      } catch {
        break;
      }

      if (actionType) {
        callback(actionType);
        currentState = 'NONE';
        partialToken = '';
      } else if (actionEnd?.includes('```')) {
        const action = actionEnd?.split('```')?.[0]?.trim();
        let actionParsed: Record<string, string>;

        try {
          actionParsed = JSON.parse(action);
        } catch (e) {
          actionParsed = {action: 'Failed to read action'};
        }

        callback(actionParsed.action);
        currentState = 'NONE';
        partialToken = '';
      }
      break;
    }
    default:
      currentState = 'NONE';
      partialToken = '';
      break;
  }
}

export const config = {
  runtime: 'edge',
};

const VERBOSE = false;

export default async function handler(req: NextRequest) {
  const json = await req.json();
  const {prompt} = json;
  console.log('🚀 ~ file: code.ts:104 ~ handler ~ prompt:', prompt);

  const codebase = new Codebase();
  const tools = [
    new DynamicTool({
      name: 'List Available Files',
      description:
        'call this to get a list of all the files in the project. input should be an empty string.',
      func: async () => {
        try {
          return codebase
            .listFilePaths()
            .map((p) => `<project-root>${p}`)
            .join('\n');
        } catch (error) {
          return `Failed to list files: ${error}`;
        }
      },
    }),
    new DynamicTool({
      name: 'Get File Contents by Path',
      description:
        'call this to get the contents of a file. input should be the path to the file.',
      func: async (input) => {
        try {
          // console.log(`get-file input:`, input);
          return codebase.getFile(input)?.code || 'file not found';
        } catch (error) {
          return `Failed to get file: ${error}`;
        }
      },
    }),
    new DynamicTool({
      name: 'Get File Path Format Instructions',
      description:
        'call this to get the instructions for how to format the path to a file. input should be an empty string.',
      func: async () => {
        return `The path should be formatted as follows:
- start with a forward slash (/)
- end with .js or .jsx
- the path should be relative to the project root
        `;
      },
    }),
    new DynamicTool({
      name: 'Create New File',
      description:
        'call this to create a new file. input should be the path to the file and the code as a string format: path,newCode',
      func: async (input) => {
        // console.log(`create-file input:`, input);
        try {
          const [path, ...newCode] = input.split(',');
          if (!path.endsWith('.js') && !path.endsWith('.jsx'))
            return 'path must end with .js or .jsx';
          if (!path.startsWith('/')) return 'path must start with /';
          codebase.createFile(
            path as `/${string}.js` | `/${string}.jsx`,
            newCode.join(','),
          );
          return 'file created successfully!';
        } catch (error) {
          return `Failed to create file: ${error}`;
        }
      },
    }),
    new DynamicTool({
      name: 'Set File Contents',
      description:
        'call this to set the contents of a file. input should be the path to the file and the code as a string format: path,newCode',
      func: async (input) => {
        try {
          const [path, ...newCode] = input.split(',');
          codebase.updateFile(path, newCode.join(','));
          return 'file updated successfully!';
        } catch (error) {
          return `Failed to update file: ${error}`;
        }
      },
    }),
    new DynamicTool({
      name: 'List Installed Dependencies',
      description:
        'call this to get a list of all the dependencies in the project. input should be an empty string.',
      func: async () => {
        try {
          return codebase
            .listDependencies()
            .map((d) => d.name)
            .join('\n');
        } catch (error) {
          return `Failed to list dependencies: ${error}`;
        }
      },
    }),
    new DynamicTool({
      name: 'Install Dependency',
      description:
        'call this to install a new dependency. input should be the name of the dependency.',
      func: async (input) => {
        try {
          codebase.installDependency(input);
          return 'installed successfully!';
        } catch (error) {
          return `Failed to install dependency "${input}": ${error}`;
        }
      },
    }),
  ];

  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('START'));

      const chat = new OpenAIChat({
        temperature: 0,
        verbose: VERBOSE,
        streaming: true,
        callbackManager: CallbackManager.fromHandlers({
          async handleLLMNewToken(t: string) {
            processToken(t, (text) => controller.enqueue(encoder.encode(text)));
          },
        }),
      });

      try {
        const executor = await initializeAgentExecutor(
          tools,
          chat,
          'chat-zero-shot-react-description',
          VERBOSE,
        );

        await executor.call({
          input: `You are a Senior React.js Developer working on a JavaScript (not TypeScript), multi-file, Single Paged Application project.
All UI work should use Chakra UI, however you can install any supplementary dependencies if you need.
The project already has the following dependencies installed: ${codebase
            .listDependencies()
            .map((d) => d.name)}.
You are going to update the codebase using the following instruction: "${prompt}".`,
        });
      } catch (error) {
        console.error(error);
        controller.enqueue(encoder.encode('ERROR'));
      }

      controller.close();
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
