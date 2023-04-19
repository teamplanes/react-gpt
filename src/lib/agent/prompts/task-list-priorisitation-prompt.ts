import dedent from 'dedent';
import {TaskListOutputParser} from './list-output-parser';
import {CodePromptTemplate, createInputVariables} from './code-prompt-template';

const taskListPrioritisationTemplate = dedent`
  You are a task prioritisation AI tasked with cleaning the formatting of and re-prioritizing

  the following task list:
  \`\`\`json
  {task_list}
  \`\`\`

  Consider the ultimate objective of: {objective}.

  Please only reorder or remove tasks to make the list suitable for the objective.

  {format_instructions}
`;

const inputVariables = createInputVariables(
  'task_list',
  'format_instructions',
  'objective',
);

export const taskListPrioritisationPrompt = new CodePromptTemplate({
  template: taskListPrioritisationTemplate,
  outputParser: new TaskListOutputParser(),
  inputVariables,
});
