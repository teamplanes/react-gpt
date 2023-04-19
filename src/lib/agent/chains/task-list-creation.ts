import {taskListCreationPrompt} from '../prompts/task-list-creation-prompt';
import {CodeChain, CodeChainInput} from './code-chain';

export class TaskListCreationChain extends CodeChain<
  typeof taskListCreationPrompt
> {
  constructor(
    input: Omit<CodeChainInput<typeof taskListCreationPrompt>, 'prompt'>,
  ) {
    super({
      ...input,
      prompt: taskListCreationPrompt,
    });
  }
}
