import {BaseOutputParser, OutputParserException} from 'langchain/schema';

export class CodeOutputParser extends BaseOutputParser {
  constructor(public language: string = 'js') {
    super();
  }

  getFormatInstructions(): string {
    return `The output should be a ${this.language} code snippet formatted in the following schema:
\`\`\`${this.language}
<code>
\`\`\`
`;
  }

  async parse(text: string): Promise<string> {
    try {
      const code = text
        .trim()
        .split(`\`\`\`${this.language}`)[1]
        .split('```')[0]
        .trim();
      return code;
    } catch (e) {
      throw new OutputParserException(
        `Failed to parse. Text: ${text}. Error: ${e}`,
      );
    }
  }
}
