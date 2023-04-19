import {useMemo, useRef, useState} from 'react';
import {ChatOpenAI} from 'langchain/chat_models/openai';
import {createCreateNewFileTool} from './agent/tools/create-new-file';
import {createGetFileContentsByPathTool} from './agent/tools/get-file-contents-by-path';
import {createGetFilePathFormatInstructionsTool} from './agent/tools/get-file-path-format-instructions';
import {createInstallDependencyTool} from './agent/tools/install-dependency';
import {createListAvailableFilesTool} from './agent/tools/list-available-files';
import {createListInstalledDependenciesTool} from './agent/tools/list-installed-dependencies';
import {createSetFileContentsTool} from './agent/tools/set-file-contents';
import {CodeTool} from './agent/tools/code-tool';
import {Codebase} from './agent/types';
import {AgentCode, AgentState} from './agent';

export const useAgent = (
  options: Codebase,
): {agent: AgentCode; state: AgentState | undefined} => {
  const [agentState, setAgentState] = useState<AgentState>();
  const codebaseRef = useRef(options);
  codebaseRef.current = options;

  const tools = useMemo(
    () => [
      createGetFileContentsByPathTool(codebaseRef),
      createListAvailableFilesTool(codebaseRef),
      createCreateNewFileTool(codebaseRef),
      createGetFilePathFormatInstructionsTool(),
      createSetFileContentsTool(codebaseRef),
      createListInstalledDependenciesTool(codebaseRef),
      createInstallDependencyTool(codebaseRef),
    ],

    [codebaseRef],
  );

  const agent = useRef(
    new AgentCode({
      listener: setAgentState,
      llm: new ChatOpenAI(
        {temperature: 0, openAIApiKey: 'thisisnotthekey'},
        {basePath: '/openai'},
      ),
      codebaseRef,
      tools: tools as CodeTool[],
    }),
  );

  return {agent: agent.current, state: agentState};
};
