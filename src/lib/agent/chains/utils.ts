import {CodeTool} from '../tools/code-tool';

export const formatAvailableTools = (tools: CodeTool[]): string => {
  return tools.map((tool) => `- ${tool.name}: ${tool.description}`).join('\n');
};
