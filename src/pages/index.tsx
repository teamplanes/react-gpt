/* eslint-disable no-await-in-loop */
import Head from 'next/head';
import {
  SandpackLayout,
  SandpackPreview,
  SandpackPreviewRef,
  SandpackProvider,
  useSandpack,
} from '@codesandbox/sandpack-react';
import {useRef, useState} from 'react';
import {
  Box,
  Center,
  Container,
  Flex,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import {PromptForm} from '@/components/instruction-form';
import {
  useSandpackToolset,
  SandpackToolsetOptions,
} from '@/lib/sandpack-toolset';
import {
  executeSandpackAgent,
  executeSandpackFixerAgent,
} from '@/lib/sandpack-agent';
import {initialCodebaseState} from '@/lib/initial-codebase-state';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function Page(props: SandpackToolsetOptions) {
  const toast = useToast();
  const {sandpack} = useSandpack();
  const [thoughtProcess, setThoughtProcess] = useState<string>('');
  const previewRef = useRef<SandpackPreviewRef>(null);
  const sandpackToolset = useSandpackToolset(props);

  const [isLoading, setIsLoading] = useState(false);
  const [instruction, setInstruction] = useState('');

  const handleSubmit = async (errorFix?: boolean) => {
    setIsLoading(true);
    try {
      setThoughtProcess('');
      if (errorFix) {
        if (!sandpack.error) {
          throw new Error('No error to fix');
        }

        await executeSandpackFixerAgent(sandpack.error, sandpackToolset, {
          onNewToken: (token) => {
            setThoughtProcess((prev) => `${prev}${token}`);
          },
        });
      } else {
        await executeSandpackAgent(instruction, sandpackToolset, {
          onNewToken: (token) => {
            setThoughtProcess((prev) => `${prev}${token}`);
          },
        });
      }
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
              // TODO
              onFix={() => handleSubmit(true)}
              errorMessage={sandpack.error?.message || ''}
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
              fontSize="sm"
              color="white"
              whiteSpace="pre-wrap"
              sx={{
                '& > *': {
                  overflowAnchor: 'none',
                },
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                // eslint-disable-next-line react/no-children-prop
                children={
                  thoughtProcess
                    ?.replaceAll(`Action:`, '\n\n---\n**Action:**')
                    ?.replaceAll(`Question:`, '\n\n---\n**Question:**')
                    ?.replaceAll(`Thought:`, '\n\n---\n**Thought:**') || '...'
                }
              />
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
  console.log({files, dependencies});
  return (
    <>
      <Head>
        <title>ReactGPT</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
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
          onUpdateFiles={(newFiles) => setFiles(newFiles)}
          onUpdateDependencies={(newDependencies) =>
            setDependencies(newDependencies)
          }
        />
      </SandpackProvider>
    </>
  );
}
