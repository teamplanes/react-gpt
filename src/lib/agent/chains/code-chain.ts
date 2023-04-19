import {LLMChain} from 'langchain/chains';
import {LLMChainInput} from 'langchain/dist/chains/llm_chain';
import {CodePromptTemplate} from '../prompts/code-prompt-template';
import {Task} from '../types';

export interface CodeChainInput<Template extends CodePromptTemplate>
  extends Omit<LLMChainInput, 'prompt'> {
  prompt: Template;
}

export class CodeChain<Template extends CodePromptTemplate> extends LLMChain {
  constructor(input: CodeChainInput<Template>) {
    super(input);
    this.prompt = input.prompt as Template;
  }

  outputKey = 'tasks';

  async call(
    values: Record<
      Template['inputVariables'][number],
      string | (() => Promise<string>)
    >,
  ): Promise<Task[]> {
    return (super.call(values) as unknown as Promise<{tasks: Task[]}>).then(
      (result) => result.tasks,
    );
  }
}
