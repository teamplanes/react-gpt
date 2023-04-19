/* eslint-disable no-constant-condition */
import {BaseChatModel} from 'langchain/chat_models';
import dedent from 'dedent';
import {CodeTool} from './tools/code-tool';
import {CodebaseRef, Task} from './types';
import {TaskCreationChain} from './chains/task-creation';
import {TaskListPrioritisationChain} from './chains/task-list-prioritisation';
import {TaskListCreationChain} from './chains/task-list-creation';
import {TaskListOutputParser} from './prompts/list-output-parser';
import {executionGuidelinesPrompt} from './prompts/execution-guidelines-prompt';

interface DoneTask {
  task: Task;
  result: string;
}

export interface AgentState {
  currentTask: Task | null;
  doneTasks: DoneTask[];
  taskList: Task[];
  isLoadingTaskList: boolean;
}

interface AgentCodeOptions {
  tools: CodeTool[];
  llm: BaseChatModel;
  codebaseRef: CodebaseRef;
  listener?: (state: AgentState) => void;
  maxIterations?: number;
}

export class AgentCode {
  private taskList: Array<Task> = [];

  private taskCreationChain: TaskCreationChain;

  private taskListPrioritisationChain: TaskListPrioritisationChain;

  private taskListCreationChain: TaskListCreationChain;

  private tools: CodeTool[];

  private taskIdCounter = 1;

  private maxIterations = 1000;

  private error: string | null = null;

  private codebaseRef: CodebaseRef;

  private currentTask: Task | null = null;

  private doneTasks: DoneTask[] = [];

  private outputParser = new TaskListOutputParser();

  private isLoadingTaskList = false;

  private listener?: AgentCodeOptions['listener'];

  constructor(input: AgentCodeOptions) {
    this.taskCreationChain = new TaskCreationChain({
      llm: input.llm,
    });

    this.taskListPrioritisationChain = new TaskListPrioritisationChain({
      llm: input.llm,
    });

    this.taskListCreationChain = new TaskListCreationChain({
      llm: input.llm,
    });

    this.codebaseRef = input.codebaseRef;
    this.tools = input.tools;
    this.listener = input.listener;
    this.maxIterations = input.maxIterations || this.maxIterations;
  }

  private publishChange() {
    if (this.listener) {
      this.listener({
        currentTask: this.currentTask,
        doneTasks: this.doneTasks,
        taskList: this.taskList,
        isLoadingTaskList: this.isLoadingTaskList,
      });
    }
  }

  public setError(error: string | null | undefined) {
    this.error = error || null;
  }

  private getInstructions() {
    return executionGuidelinesPrompt.format({
      file_structure: Object.keys(this.codebaseRef.current.files)
        .filter((name) => !['/index.js', '/App.js'].includes(name))
        .map((name) => `- ${name}`)
        .join('\n'),
    });
  }

  private async executeTask(): Promise<string> {
    if (!this.currentTask) {
      throw new Error('No task to execute');
    }

    const task = this.currentTask;
    const tool = this.tools.find((t) => t.name === task.tool_name);

    if (!tool) {
      return `No tool found for task "${
        task.task_name
      }", available tools: ${this.tools.map((t) => t.name).join(', ')}`;
    }
    const result = await tool.call(task.tool_input);
    return result;
  }

  private async createTaskList(objective: string) {
    try {
      this.setIsLoadingTaskList(true);
      const response = await this.taskListCreationChain.call({
        objective,
        error_warning: this.error
          ? dedent`
            :warning: There was an error while executing one of the previous tasks.
            It is up to you if want to fix it, however you may already have a task that fixes it.

            The error was:
            ${this.error}
            `
          : '',
        available_tools: this.tools
          .map((t) => `- ${t.name}: ${t.description}`)
          .join('\n'),
        format_instructions: this.outputParser.getFormatInstructions(),
        instructions: await this.getInstructions(),
      });
      this.setIsLoadingTaskList(false);
      return response;
    } catch (e) {
      this.setIsLoadingTaskList(false);
      throw e;
    }
  }

  private async getNextTasks(
    previousTask: {
      task: Task;
      result: string;
    },
    objective: string,
  ) {
    return this.taskCreationChain.call({
      format_instructions: this.outputParser.getFormatInstructions(),
      instructions: await this.getInstructions(),
      result: previousTask.result,
      available_tools: this.tools
        .map((t) => `- ${t.name}: ${t.description}`)
        .join('\n'),
      task_description: previousTask.task.task_name,
      incomplete_tasks: JSON.stringify(this.taskList, null, 2),
      completed_tasks: this.doneTasks
        .map(({task}) => `* ${task.task_name}`)
        .join('\n'),
      objective,
    });
  }

  private async prioritizeTasks(objective: string) {
    const response = await this.taskListPrioritisationChain.call({
      task_list: JSON.stringify(this.taskList, null, 2),
      objective,
      format_instructions: this.outputParser.getMinimalFormatInstructions(),
    });

    return response.map((t) => {
      const foundTask = this.taskList.find(
        (tl) => Number(tl.task_id) === Number(t.task_id),
      );

      if (!foundTask) {
        throw new Error(`Could not find task with id ${t.task_id}`);
      }

      return foundTask;
    });
  }

  private setIsLoadingTaskList(isLoadingTaskList: boolean) {
    this.isLoadingTaskList = isLoadingTaskList;
    this.publishChange();
  }

  private addTasks(taskList: Task[]) {
    this.taskList = [...this.taskList, ...taskList];
    this.publishChange();
  }

  private setTaskList(taskList: Task[]) {
    this.taskList = [...taskList];
    this.publishChange();
  }

  private progressCurrentTask() {
    this.currentTask = this.taskList.shift() as Task;
    this.publishChange();
    return this.currentTask;
  }

  private completeCurrentTask(result: string) {
    this.doneTasks.push({
      task: this.currentTask as Task,
      result,
    });
    this.currentTask = null;
    this.publishChange();
  }

  async call(inputs: Record<string, any>): Promise<Record<string, any>> {
    const {objective} = inputs;

    this.setTaskList(await this.createTaskList(objective));

    let numIters = 0;

    // Reset the state for a new objective
    this.doneTasks = [];
    this.currentTask = null;
    this.error = null;
    this.taskIdCounter = 1;

    while (true) {
      // If we hit the max iterations or there are no more tasks, exit the loop
      if (this.maxIterations !== null && numIters === this.maxIterations) break;
      if (!this.taskList.length) {
        // Wait just in case sandpack has set an error in the meantime
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((res) => setTimeout(res, 2000));
        if (!this.error) {
          break;
        }

        // Otherwise, start again basically
        this.setTaskList(await this.createTaskList(objective));
      }

      numIters += 1;

      const currentTask = this.progressCurrentTask();

      const start = Date.now();
      const result = await this.executeTask();
      // Ensure task execution time is at least 1s
      await new Promise((res) =>
        // eslint-disable-next-line no-promise-executor-return
        setTimeout(res, Math.max(1000 - (Date.now() - start), 0)),
      );

      if (result.startsWith('ToolSuccess:')) {
        this.completeCurrentTask(result);
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((res) => setTimeout(res, 500));
        continue;
      }

      // Get a unique list of new tasks, these do not include any tasks
      // already in the task list
      const newTasks = await this.getNextTasks(
        {task: currentTask, result},
        objective,
      );

      // Only add done task after we get the new tasks, as we use the
      // `done_tasks` variable to get the new tasks + previously completed
      // tasks. So we'd be double counting if we added it before.
      this.completeCurrentTask(result);

      // Add new tasks to the task list
      this.addTasks(
        newTasks.map((newTask) => {
          // Ensure that each task has a unique id
          this.taskIdCounter += 1;
          // eslint-disable-next-line no-param-reassign
          return {
            ...newTask,
            task_id: this.taskIdCounter,
          };
        }),
      );

      // Prioritize the task list, and potentially remove tasks
      const prioritisedTasks = await this.prioritizeTasks(objective);
      this.setTaskList(prioritisedTasks);
    }

    return {};
  }
}
