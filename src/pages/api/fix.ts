// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next';
import {ChatOpenAI} from 'langchain/chat_models';
import {HumanChatMessage, SystemChatMessage} from 'langchain/schema';
import {CodeOutputParser} from '@/lib/code-output-parser';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {errorMessage, code} = req.body;
  const parser = new CodeOutputParser();
  const chat = new ChatOpenAI();

  const packages = [
    '@chakra-ui/react',
    '@emotion/react',
    '@emotion/styled',
    'framer-motion',
    'react-icons',
    'react',
  ];

  const response = await chat.call([
    new SystemChatMessage(
      `You are a React.js developer working on a JavaScript (not TypeScript) project. The project you are working on has the following packages installed: ${packages.join(
        ', ',
      )}`,
    ),
    new HumanChatMessage(
      `${parser.getFormatInstructions()} I want to fix the following code file: \n\`\`\`js${code}\`\`\`\n\nI am getting the following error: "${errorMessage}".`,
    ),
  ]);

  const outputCode = await parser.parse(response.text);

  res.status(200).json({code: outputCode});
}
