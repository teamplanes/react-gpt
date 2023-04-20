# ReactGPT

This project is an attempt at creating an autonomous React.js Developer. It uses
the concepts many of the concepts in
[BabyAGI](https://github.com/yoheinakajima/babyagi), but extrapolates them
slightly. Most notably by equipping the agent with tools to execute, and
tailoring the prompts to the objective.

**This project is just an experiment** and not reliable what-so-ever. That said,
hopefully it's a demonstration of some patterns that may be useful.

🤞... maybe a GPT-4 API key will improve the results.

![A git of React GPT creating a Login UI](reactgpt.gif)


### Features

## Getting Started

Please add a `OPENAI_API_KEY` key to a new `.env` in the project root.

Now, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How it Works

The pseudo-code for the agent is as follows:

- User enters an 'objective' (e.g. "Create a login UI")
- The Agent then creates an initial task list (the list is a JSON list of
  commands + inputs for the set of tools)
- The Agent then commences executing tasks in the task list, each tool interacts
  with the 'codebase' (we are using
  [Sandpack](https://sandpack.codesandbox.io/))
- The Agent the determines any new tasks needed to be added to the task list,
  based on the output of the previous task
- The tasks are added to the task list
- The agent is then asked to prioritize the tasks

### Tools

Tools are just functions that take a set of inputs, and act on the codebase.

Check out the `/src/lib/agent/tools` directory for more details.
