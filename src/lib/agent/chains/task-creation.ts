import {CodeChain, CodeChainInput} from './code-chain';
import {taskCreationPrompt} from '../prompts/task-creation-prompt';

export class TaskCreationChain extends CodeChain<typeof taskCreationPrompt> {
  constructor(
    input: Omit<CodeChainInput<typeof taskCreationPrompt>, 'prompt'>,
  ) {
    super({
      ...input,
      prompt: taskCreationPrompt,
    });
  }
}
