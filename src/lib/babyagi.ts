/* eslint-disable no-continue */
/* eslint-disable camelcase */
/* eslint-disable no-restricted-syntax */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-await-in-loop */
/* eslint-disable max-classes-per-file */
import {LLMChain, PromptTemplate} from 'langchain';
import {BaseChatModel} from 'langchain/chat_models';
import {
  BaseOutputParser,
  ChainValues,
  OutputParserException,
} from 'langchain/schema';
import {DynamicTool} from 'langchain/tools';

class TaskListOutputParser extends BaseOutputParser {
  getFormatInstructions(): string {
    return (
      'Return the tasks using the following JSON array list format:\n\n' +
      '```json\n' +
      '[\n' +
      ' {\n' +
      '   "task_id": "a unique id for the first task",\n' +
      '   "task_name": "a descriptive name for the first task",\n' +
      '   "tool_input": "task input as required by the tool",\n' +
      '   "tool_name": "tool name"\n' +
      ' },\n' +
      // ' {\n' +
      // '   "task_id": "a unique id for the second task",\n' +
      // '   "task_name": "a descriptive name for the second task",\n' +
      // '   "tool_input": "task input as required by the tool",\n' +
      // '   "tool_name": "tool name"\n' +
      // ' },\n' +
      ' // repeat for each task\n' +
      ']\n' +
      '```\n' +
      'The task list should be correctly formatted JSON, and should not contain any comments. Please only return the JSON and no explanation.\n'
    );
  }

  async parse(input: string): Promise<Task[]> {
    try {
      const match = /^(([ \t]*`{3,4})([^\n]*)([\s\S]+?)(^[ \t]*\2))/gm.exec(
        input,
      );

      if (match) {
        const [, , , , code] = match;
        return JSON.parse(code);
      }

      return JSON.parse(input);
    } catch (e) {
      console.log('Error parsing output: ', input);
      throw new OutputParserException((e as Error)?.message);
    }
  }
}

const formateAvailableTools = (tools: DynamicTool[]): string => {
  return tools.map((tool) => `${tool.name}: ${tool.description}`).join('\n');
};

class TaskCreationChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({prompt, llm});
  }

  static from_llm(llm: BaseChatModel, tools: DynamicTool[]): LLMChain {
    const availableTools = formateAvailableTools(tools);

    const taskCreationTemplate: string =
      'You are a task creation AI that uses the result of an execution agent' +
      ' to create new tasks with the following objective: {objective}' +
      ' The last completed task has the result: {result}.' +
      ' This result was based on this task description: {task_description}.' +
      ' The following tasks have already been completed:\n{completed_tasks}\n' +
      ' These are incomplete tasks list:\n```json\n{incomplete_tasks}\n```\n' +
      ' Based on the result, create new tasks to be completed' +
      ' by the AI system that do not overlap with incomplete tasks.' +
      ' Only create tasks that are required to complete the objective, return an empty JSON array if none are required.' +
      ' New tasks should be created using the following tools: \n{available_tools}\n' +
      ' Please return the JSON array list of any additional tasks we should complete.\n\n' +
      ' {format_instructions}';

    const parser = new TaskListOutputParser();

    const prompt = new PromptTemplate({
      template: taskCreationTemplate,
      outputParser: parser,
      partialVariables: {
        available_tools: availableTools,
        format_instructions: parser.getFormatInstructions(),
      },
      inputVariables: [
        'result',
        'completed_tasks',
        'task_description',
        'incomplete_tasks',
        'objective',
      ],
    });

    return new TaskCreationChain(prompt, llm);
  }
}

class TaskListInitializationChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({
      prompt,
      llm,
    });
  }

  static from_llm(llm: BaseChatModel, tools: DynamicTool[]): LLMChain {
    const availableTools = formateAvailableTools(tools);

    const taskCreationTemplate: string =
      'You are a task creation AI creates task lists based on the following objective: {objective}.' +
      ' You are creating the initial task list for a development agent.' +
      ' We should only be planning 3 steps ahead.\n' +
      ' New tasks should be created using the following tools: \n{available_tools}\n' +
      ' {format_instructions}.';

    const parser = new TaskListOutputParser();

    const prompt = new PromptTemplate({
      template: taskCreationTemplate,
      outputParser: parser,
      partialVariables: {
        available_tools: availableTools,
        format_instructions: parser.getFormatInstructions(),
      },
      inputVariables: ['objective'],
    });

    return new TaskListInitializationChain(prompt, llm);
  }
}

class TaskPrioritizationChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({prompt, llm});
  }

  static from_llm(
    llm: BaseChatModel,
    tools: DynamicTool[],
  ): TaskPrioritizationChain {
    const availableTools = formateAvailableTools(tools);
    const taskPrioritizationTemplate: string =
      'You are a task prioritization AI tasked with cleaning the formatting of and reprioritizing' +
      ' the following task list:\n```json\n{task_list}```\n' +
      ' Consider the ultimate objective of your team: {objective}.' +
      ' Please only reorder or remove tasks to make the list suitable for the objective.' +
      ' We should only be planning 3 steps ahead, so please remove any tasks that are more than 3 steps away from the first task.\n' +
      ' {format_instructions}';

    const parser = new TaskListOutputParser();

    const prompt = new PromptTemplate({
      template: taskPrioritizationTemplate,
      outputParser: parser,
      inputVariables: ['task_list', 'objective', 'format_instructions'],
      partialVariables: {
        available_tools: availableTools,
        format_instructions: parser.getFormatInstructions(),
      },
    });

    return new TaskPrioritizationChain(prompt, llm);
  }
}

class TaskErrorInterruptionChain extends LLMChain {
  constructor(prompt: PromptTemplate, llm: BaseChatModel) {
    super({prompt, llm});
  }

  static from_llm(
    llm: BaseChatModel,
    tools: DynamicTool[],
  ): TaskPrioritizationChain {
    const availableTools = formateAvailableTools(tools);
    const taskPrioritizationTemplate: string =
      'You are a task planning AI tasked, you previously created a set of tasks and an execution agent has been executing them.\n' +
      ' The execution agent has encountered an error and is unable to continue:\n{error_message}\n' +
      ' The task list currently includes:\n```json\n{task_list}```\n' +
      ' You MUST consider the ultimate objective of your team: {objective}.' +
      ' Please replan the entire list to fix the error and make the list suitable for the objective.\n' +
      ' {format_instructions}';

    const parser = new TaskListOutputParser();

    const prompt = new PromptTemplate({
      template: taskPrioritizationTemplate,
      outputParser: parser,
      inputVariables: [
        'task_list',
        'error_message',
        'objective',
        'format_instructions',
      ],
      partialVariables: {
        available_tools: availableTools,
        format_instructions: parser.getFormatInstructions(),
      },
    });

    return new TaskPrioritizationChain(prompt, llm);
  }
}

async function getNextTask(
  taskCreationChain: TaskCreationChain,
  result: string,
  lastTask: Task,
  taskList: Task[],
  doneTaskNames: string[],
  objective: string,
): Promise<any[]> {
  const response: Task[] = (await taskCreationChain.predict({
    result,
    task_description: lastTask,
    incomplete_tasks: JSON.stringify(taskList, null, 2),
    completed_tasks: doneTaskNames.map((name) => `* ${name}`).join('\n'),
    objective,
  })) as any;

  return response;
}

interface Task {
  task_id: number;
  task_name: string;
  tool_input: string;
  tool_name: string;
}

async function prioritizeTasks(
  taskPrioritizationChain: LLMChain,
  taskList: Task[],
  objective: string,
): Promise<Task[]> {
  const response = await taskPrioritizationChain.predict({
    task_list: JSON.stringify(taskList, null, 2),
    objective,
  });

  return (response as any as Task[]).map((task) => {
    return {...task, task_id: parseInt(task.task_id as any as string, 10)};
  });
}

// In here we just find a tool and run it based on the task
async function executeTask(tools: DynamicTool[], task: Task): Promise<string> {
  const tool = tools.find((t) => t.name === task.tool_name);
  if (!tool) {
    throw new Error(`No tool found for task ${task.task_name}`);
  }
  const result = await tool.call(task.tool_input);
  return result;
}

export class BabyAGI {
  taskList: Array<Task> = [];

  taskCreationChain: TaskCreationChain;

  taskPrioritizationChain: TaskPrioritizationChain;

  taskListInitializationChain: TaskListInitializationChain;

  taskErrorInterruptionChain: TaskErrorInterruptionChain;

  tools: DynamicTool[];

  llm: BaseChatModel;

  taskIdCounter = 1;

  maxIterations = 50;

  private error: string | null = null;

  constructor(
    taskCreationChain: TaskCreationChain,
    taskPrioritizationChain: TaskPrioritizationChain,
    taskListInitializationChain: TaskListInitializationChain,
    taskErrorInterruptionChain: TaskErrorInterruptionChain,
    tools: DynamicTool[],
    llm: BaseChatModel,
  ) {
    this.taskCreationChain = taskCreationChain;
    this.taskPrioritizationChain = taskPrioritizationChain;
    this.taskListInitializationChain = taskListInitializationChain;
    this.taskErrorInterruptionChain = taskErrorInterruptionChain;
    this.tools = tools;
    this.llm = llm;
  }

  addTask(task: Task) {
    this.taskList.push(task);
  }

  printTaskList() {
    console.log('\x1b[95m\x1b[1m\n*****TASK LIST*****\n\x1b[0m\x1b[0m');
    this.taskList.forEach((t) => console.log(`${t.task_id}: ${t.task_name}`));
  }

  printNextTask(task: Task) {
    console.log('\x1b[92m\x1b[1m\n*****NEXT TASK*****\n\x1b[0m\x1b[0m');
    console.log(`${task.task_id}: ${task.task_name}`);
  }

  printNewTask(task: Task) {
    console.log('\x1b[91m\x1b[1m\n*****NEW TASK*****\n\x1b[0m\x1b[0m');
    console.log(`${task.task_id}: ${task.task_name}`);
  }

  printTaskResult(result: string) {
    console.log('\x1b[93m\x1b[1m\n*****TASK RESULT*****\n\x1b[0m\x1b[0m');
    console.log(result);
  }

  getInputKeys(): string[] {
    return ['objective'];
  }

  getOutputKeys(): string[] {
    return [];
  }

  interruptExecutionWithTaskError(error: string) {
    this.error = error;
    console.log('\x1b[91m\x1b[1m\n*****ERROR*****\n\x1b[0m\x1b[0m');
    console.log(error);
  }

  async resetTaskListAfterInterruption(objective: string) {
    this.taskList = (await this.taskErrorInterruptionChain.predict({
      task_list: JSON.stringify(this.taskList, null, 2),
      objective,
      error_message: this.error,
    })) as any as Task[];
    this.error = null;
    this.taskIdCounter = 1;

    console.log('Task List Reset After Error');
    this.printTaskList();
  }

  async call(inputs: Record<string, any>): Promise<Record<string, any>> {
    const {objective} = inputs;

    this.taskList = (await this.taskListInitializationChain.predict({
      objective,
    })) as any as Task[];

    let numIters = 0;
    let loop = true;
    const doneTasks = [];

    while (loop) {
      if (this.taskList.length) {
        this.printTaskList();
        const task = this.taskList.shift() as Task;
        this.printNextTask(task);

        // This should be called after any async calls, as it may have been interrupted
        if (this.error) {
          await this.resetTaskListAfterInterruption(objective);
          continue;
        }

        const result = await executeTask(this.tools, task);
        this.printTaskResult(result);

        if (this.error) {
          await this.resetTaskListAfterInterruption(objective);
          continue;
        }

        // Get a unique list of new tasks, these do not include any tasks
        // already in the task list
        const newTasks = await getNextTask(
          this.taskCreationChain,
          result,
          task,
          this.taskList,
          doneTasks,
          objective,
        );

        if (this.error) {
          await this.resetTaskListAfterInterruption(objective);
          continue;
        }

        // Only add done task after we get the new tasks, as we use the
        // `done_tasks` variable to get the new tasks + previously completed
        // tasks. So we'd be double counting if we added it before.
        doneTasks.push(task.task_name);

        console.log('\x1b[91m\x1b[1m\n*****NEW TASKS*****\n\x1b[0m\x1b[0m');
        console.log(newTasks);

        // Add new tasks to the task list
        newTasks.forEach((newTask) => {
          // Ensure that each task has a unique id
          this.taskIdCounter += 1;
          // eslint-disable-next-line no-param-reassign
          newTask.task_id = this.taskIdCounter;
          this.addTask(newTask);
          this.printNewTask(newTask);
        });

        if (this.error) {
          await this.resetTaskListAfterInterruption(objective);
          continue;
        }

        // Prioritize the task list, and potentially remove tasks
        this.taskList = await prioritizeTasks(
          this.taskPrioritizationChain,
          this.taskList,
          result,
        );

        if (this.error) {
          await this.resetTaskListAfterInterruption(objective);
        }
      }
      numIters += 1;
      if (this.maxIterations !== null && numIters === this.maxIterations) {
        console.log('\x1b[91m\x1b[1m\n*****TASK ENDING*****\n\x1b[0m\x1b[0m');
        console.log(this.maxIterations);

        loop = false;
      }
    }

    return {};
  }

  static fromLLM(llm: BaseChatModel, tools: DynamicTool[]): BabyAGI {
    const taskCreationChain = TaskCreationChain.from_llm(llm, tools);
    const taskListInitializationChain = TaskListInitializationChain.from_llm(
      llm,
      tools,
    );
    const taskPrioritizationChain = TaskPrioritizationChain.from_llm(
      llm,
      tools,
    );
    const taskErrorInterruptionChain = TaskErrorInterruptionChain.from_llm(
      llm,
      tools,
    );

    return new BabyAGI(
      taskCreationChain,
      taskPrioritizationChain,
      taskListInitializationChain,
      taskErrorInterruptionChain,
      tools,
      llm,
    );
  }
}
