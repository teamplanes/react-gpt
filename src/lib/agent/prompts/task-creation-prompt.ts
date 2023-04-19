import dedent from 'dedent';
import {TaskListOutputParser} from './list-output-parser';
import {CodePromptTemplate, createInputVariables} from './code-prompt-template';

const taskCreationTemplate = dedent`
  You are a task creation AI that uses the result of an execution agent
  to create new tasks with the following objective:
  Using React.js build a UI - {objective}

  NOTE: Only create tasks that are required to complete the objective, return an empty JSON array if additional tasks are required.

  Your guidelines for completing the objective are:
  {instructions}

  PREVIOUSLY EXECUTED TASK:
  Task description: {task_description}
  Task result: {result}

  Use this result to create new tasks to be completed by the AI system that do not overlap with incomplete tasks.

  The following tasks have already been completed:
  {completed_tasks}

  TASKS TO COMPLETE:
  \`\`\`json
  {incomplete_tasks}
  \`\`\`

  New tasks should be created using the following tools:
  {available_tools}

  Please return the JSON array list of any additional tasks we should complete.
  {format_instructions}
`;

const inputVariables = createInputVariables(
  'result',
  'available_tools',
  'completed_tasks',
  'task_description',
  'incomplete_tasks',
  'format_instructions',
  'objective',
  'instructions',
);

export const taskCreationPrompt = new CodePromptTemplate({
  template: taskCreationTemplate,
  outputParser: new TaskListOutputParser(),
  inputVariables,
});
