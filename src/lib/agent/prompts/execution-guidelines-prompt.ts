import dedent from 'dedent';
import {CodePromptTemplate, createInputVariables} from './code-prompt-template';

const template = dedent`
- The codebase is written in JavaScript.
- Your working directory is the root of the codebase (i.e. '/')
- You already have Chakra UI (@chakra-ui/react) and Motion (framer-motion) installed, along with React.
- Please use the Chakra UI components for styling.
- Please format your code neatly and consistently.
- You can create new Component, React Hooks, or any other JavaScript files as needed.
- There is no file at "/src/App.js", the correct path for the entrypoint is /App.js, you cannot create a new file at /src/App.js
- Any new files you create should be placed in the '/src' folder using a best-practice file structure
- Remember to import any new files from '/src/...' into the '/App.js' file as needed
- File structure:
  - "/index.js" is the entry point of the codebase (you do not need to change this file)
  - "/App.js" is the root component of the codebase
  {file_structure}
`;

const inputVariables = createInputVariables('file_structure');

export const executionGuidelinesPrompt = new CodePromptTemplate({
  template,
  inputVariables,
});
