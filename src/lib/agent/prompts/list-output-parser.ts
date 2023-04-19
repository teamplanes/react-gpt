import {BaseOutputParser, OutputParserException} from 'langchain/schema';
import dedent from 'dedent';
import {Task} from '../types';

export class TaskListOutputParser extends BaseOutputParser {
  getFormatInstructions(): string {
    return dedent`
      Return the tasks using the following JSON array list format:
      \`\`\`json
      [
       {
         "task_id": "a unique id for the first task",
         "task_name": "a descriptive name for the first task",
         "tool_input": "task input as required by the tool",
         "tool_name": "tool name"
       },
       // repeat for each task
      ]
      \`\`\`
      The task list should be correctly formatted JSON, and should not contain any comments. Please only return the JSON and no explanation.`;
  }

  /**
   * Used when we are just deleting/reorganising tasks, so we don't need the
   * whole task content
   */
  getMinimalFormatInstructions(): string {
    return dedent`Return the tasks using the following JSON array list format with ONLY the task_id:
      \`\`\`json
      [
       {
         "task_id": "include the task id here",
       },
       // repeat for each task
      ]
      \`\`\`
      The task list should be correctly formatted JSON, and should not contain any comments. Please only return the JSON and no explanation.`;
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

      return JSON.parse(input).map((task: Task) => ({
        ...task,
        task_id: parseInt(task.task_id as unknown as string, 10),
      }));
    } catch (e) {
      throw new OutputParserException((e as Error)?.message);
    }
  }
}
