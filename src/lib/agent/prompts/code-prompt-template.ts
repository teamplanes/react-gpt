import {PromptTemplate, PromptTemplateInput} from 'langchain/prompts';

interface CodePromptTemplateInput<InputVariables extends string[]>
  extends Omit<PromptTemplateInput, 'inputVariables' | 'partialVariables'> {
  inputVariables: InputVariables;
  partialVariables?: Record<
    InputVariables[number],
    string | (() => Promise<string>)
  >;
}

export class CodePromptTemplate<
  InputVariables extends string[] = string[],
> extends PromptTemplate {
  inputVariables: InputVariables;

  constructor(input: CodePromptTemplateInput<InputVariables>) {
    super(input);

    // This is just to connect the type system
    this.inputVariables = input.inputVariables;
    this.partialVariables = input.partialVariables;
  }

  format(
    values: Record<InputVariables[number], string | (() => Promise<string>)>,
  ): Promise<string> {
    return super.format(values);
  }
}

export function createInputVariables<T extends string[]>(
  ...args: T
): {[K in keyof T]: T[K]} {
  return args;
}
