import Head from 'next/head';
import {
  SandpackLayout,
  SandpackPreview,
  SandpackPreviewRef,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {useEffect, useRef, useState} from 'react';
import {
  Box,
  Card,
  Center,
  Container,
  Flex,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import {PromptForm} from '@/components/instruction-form';
import {initialCodebaseState} from '@/lib/initial-codebase-state';
import {Codebase} from '@/lib/agent/types';
import {useAgent} from '@/lib/use-agent';
import {TaskCard} from '@/components/task-card';

function Page(props: Codebase) {
  const toast = useToast();
  const {sandpack} = useSandpack();
  const previewRef = useRef<SandpackPreviewRef>(null);
  const {agent, state} = useAgent(props);
  const [isLoading, setIsLoading] = useState(false);
  const [instruction, setInstruction] = useState('');

  useEffect(() => {
    agent.setError(sandpack.error?.message);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sandpack.error?.message]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await agent.call({
        objective: instruction,
      });
      setIsLoading(false);
      setInstruction('');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      toast({
        title: 'An error occurred.',
        description:
          'Something went wrong, please check your instruction and try again.',
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  return (
    <Box h="100vh" bg="black">
      <Container
        maxW="container.xl"
        h="100vh"
        display="flex"
        position="relative"
        flexDirection="column"
        maxH="100vh"
        p={8}
      >
        <Stack spacing={4} direction="row" h="100%" position="relative">
          <Flex flex={1} direction="column" position="relative">
            <SandpackLayout style={{flex: 1, position: 'relative'}}>
              <SandpackPreview
                ref={previewRef}
                style={{
                  height: '100%',
                }}
              />
            </SandpackLayout>

            <PromptForm
              isLoading={isLoading}
              onChange={(newInstruction) => setInstruction(newInstruction)}
              onSubmit={() => handleSubmit()}
              instruction={instruction}
            />
          </Flex>
          <Box
            color="white"
            w="300px"
            bg="gray.900"
            h="100%"
            p={4}
            fontFamily="mono"
            borderRadius="md"
            overflowY="scroll"
          >
            <Text
              as="div"
              fontSize="sm"
              color="white"
              whiteSpace="pre-wrap"
              sx={{
                '& > *': {
                  overflowAnchor: 'none',
                },
              }}
            >
              <Stack>
                {state?.doneTasks.map((task, i) => (
                  <TaskCard
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${task.task.task_name}_doneTasks_${i}`}
                    task={task.task}
                    isLoading={false}
                    result={task.result}
                  />
                ))}
                {state?.currentTask && (
                  <TaskCard
                    key={`${state.currentTask.task_name}_currentTask`}
                    task={state.currentTask}
                    isLoading={state.isLoadingTaskList}
                  />
                )}
                {state?.taskList.map((task, i) => (
                  <TaskCard
                    // eslint-disable-next-line react/no-array-index-key
                    key={`${task.task_name}_taskList_${i}`}
                    task={task}
                    isLoading={false}
                  />
                ))}
                {state?.isLoadingTaskList && (
                  <Card
                    bg="rgba(0,0,0,0.2)"
                    p={4}
                    borderRadius="md"
                    color="white"
                    fontFamily="mono"
                    fontSize="sm"
                  >
                    <Stack
                      alignItems="center"
                      spacing={4}
                      justifyContent="center"
                    >
                      <Spinner size="sm" />
                      <Text>Busy creating task list...</Text>
                    </Stack>
                  </Card>
                )}
              </Stack>
              <Box
                style={{
                  overflowAnchor: 'auto',
                  height: '1px',
                }}
              />
            </Text>
          </Box>
        </Stack>
      </Container>
      {sandpack.status !== 'running' && (
        <Center
          h="100vh"
          w="100vw"
          position="absolute"
          top={0}
          left={0}
          bg="white"
          zIndex="overlay"
          display="flex"
          flexDirection="column"
        >
          <Spinner size="lg" />
          <Text fontSize="lg" mt={4}>
            Starting session
          </Text>
        </Center>
      )}
    </Box>
  );
}

export default function Home() {
  const [files, setFiles] = useState(initialCodebaseState.files);
  const [dependencies, setDependencies] = useState(
    initialCodebaseState.dependencies,
  );
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <>
      <Head>
        <title>ReactGPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {isReady && (
        <SandpackProvider
          template="react"
          customSetup={{
            dependencies,
          }}
          files={files}
        >
          <Page
            files={files}
            dependencies={dependencies}
            onUpdateFiles={(newFiles) => {
              setFiles(newFiles);
            }}
            onUpdateDependencies={(newDependencies) =>
              setDependencies(newDependencies)
            }
          />
        </SandpackProvider>
      )}
    </>
  );
}
