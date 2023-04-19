/* eslint-disable no-underscore-dangle */
import {Tool} from 'langchain/tools';
import dedent from 'dedent';

export const codeToolResponse = {
  info: (message: string) => `ToolInfoRetrieval: ${message}` as const,
  error: (message: string) => `ToolError: ${message}` as const,
  success: (message: string) => `ToolSuccess: ${message}` as const,
};

interface CodeToolFields<ParsedInputType> {
  name: string;
  description: string;
  func: (
    input: ParsedInputType,
  ) => Promise<
    ReturnType<(typeof codeToolResponse)[keyof typeof codeToolResponse]>
  >;
  parseInput?: (input: string | Record<string, any>) => ParsedInputType;
}

export class CodeTool<ParsedInputType = never> extends Tool {
  name: CodeToolFields<ParsedInputType>['name'];

  description: CodeToolFields<ParsedInputType>['description'];

  func: CodeToolFields<ParsedInputType>['func'];

  parseInput: (input: string | Record<string, any>) => ParsedInputType;

  constructor(fields: CodeToolFields<ParsedInputType>) {
    super();
    this.name = fields.name;
    this.description = fields.description;
    this.func = fields.func;
    this.parseInput =
      fields.parseInput ||
      ((input: string | Record<string, any>) => input as ParsedInputType);
  }

  async _call(input: string | Record<string, any>): Promise<string> {
    try {
      const inputParsed = this.parseInput(input);
      const result = await this.func(inputParsed);
      return result;
    } catch (error) {
      const stringifiedInput =
        typeof input === 'object' ? JSON.stringify(input, null, 2) : input;
      return codeToolResponse.error(dedent`
        Error running tool "${this.name}" with input:
        "${stringifiedInput}"

        The error thrown was:
        ${error}`);
    }
  }
}
