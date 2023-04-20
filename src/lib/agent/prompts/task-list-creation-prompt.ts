import dedent from 'dedent';
import {TaskListOutputParser} from './list-output-parser';
import {CodePromptTemplate, createInputVariables} from './code-prompt-template';

const taskListCreationTemplate = dedent`
  You are a task creation AI that creates task lists based on the following objective:
  Using React.js build a UI - {objective}

  You are creating the initial task list for a development execution agent.
  Break down the objective into a list of tasks that can be completed by the execution agent.
  When planning your task list, be sure to get the contents of a file before setting its contents.
  Create as many tasks as you need to complete the objective.

  Your guidelines for completing the objective are:
  {instructions}

  New tasks should be created exclusively using the following tools:
  {available_tools}

  {format_instructions}

  {error_warning}
`;

const inputVariables = createInputVariables(
  'instructions',
  'available_tools',
  'format_instructions',
  'objective',
  'error_warning',
);

export const taskListCreationPrompt = new CodePromptTemplate({
  template: taskListCreationTemplate,
  outputParser: new TaskListOutputParser(),
  inputVariables,
});
