import {taskListPrioritisationPrompt} from '../prompts/task-list-priorisitation-prompt';
import {CodeChain, CodeChainInput} from './code-chain';

export class TaskListPrioritisationChain extends CodeChain<
  typeof taskListPrioritisationPrompt
> {
  constructor(
    input: Omit<CodeChainInput<typeof taskListPrioritisationPrompt>, 'prompt'>,
  ) {
    super({
      ...input,
      prompt: taskListPrioritisationPrompt,
    });
  }
}
