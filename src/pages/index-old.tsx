/* eslint-disable no-await-in-loop */
import Head from 'next/head';
import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
  useSandpackClient,
} from '@codesandbox/sandpack-react';
import {useEffect, useRef, useState} from 'react';
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  SkeletonText,
  Spinner,
  Stack,
  Tag,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import {initialCodebaseState} from '@/lib/initial-codebase-state';

// eslint-disable-next-line no-shadow
enum CommentaryType {
  QUESTION = 'QUESTION',
  ACTION = 'ACTION',
  THOUGHT = 'THOUGHT',
}

interface CommentaryMessage {
  id: string;
  type: CommentaryType;
  body: string;
}

function Page() {
  const {sandpack} = useSandpack();
  const sp = useSandpackClient();
  console.log('🚀 ~ file: index.tsx:43 ~ Page ~ sp:', sp);

  const toast = useToast();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [commentary, setCommentary] = useState<CommentaryMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const {code} = sandpack.files['/App.js'];
      const formData = new FormData(e.currentTarget);
      const prompt = formData.get('prompt');

      const result = await fetch('/api/code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({prompt, code}),
      });

      const reader = result.body?.getReader();
      if (!reader) {
        throw new Error('Something went wrong.');
      }

      let done;
      let value: Uint8Array | undefined;
      while (!done) {
        ({value, done} = await reader.read());
        if (done) {
          break;
        }
        const textValue = new TextDecoder().decode(value);

        if (textValue === 'START') {
          // eslint-disable-next-line no-continue
          continue;
        }

        if (textValue === 'ERROR') {
          throw new Error('Something went wrong.');
        }

        if (
          Object.values(CommentaryType).some((t) => textValue.startsWith(t))
        ) {
          setCommentary((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              type: (textValue.split(' ')?.[0] || textValue) as CommentaryType,
              body: textValue.split(' ')?.slice(1)?.join(' ') || '',
            },
          ]);
        } else {
          setCommentary((prev) => {
            const newCommentary = [...prev];
            const lastCommentary = newCommentary.pop() as CommentaryMessage;
            return [
              ...newCommentary,
              {
                ...lastCommentary,
                body: (lastCommentary?.body || '') + textValue,
              },
            ];
          });
        }
      }
      if (inputRef.current?.value) inputRef.current.value = '';
      inputRef.current?.focus();
    } catch (error) {
      toast({
        title: 'An error occurred.',
        description: (error as Error).message,
        status: 'error',
        duration: 9000,
        isClosable: true,
      });
    }
    setIsLoading(false);
  };

  const handleFix = async (errorMessage: string) => {
    setIsLoading(true);
    try {
      const {code} = sandpack.files['/App.js'];
      const result = await fetch('/api/fix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({code, error: errorMessage}),
      });

      const data = await result.json();
      // sandpack.updateFile('/App.js', data.code);
    } catch (error) {
      toast({
        title: 'An error occurred.',
        description: (error as Error).message,
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
        <Flex flex={1} h="100%" position="relative">
          <Flex flex={1} direction="column">
            <SandpackLayout style={{height: '100%', width: '100%'}}>
              <SandpackPreview
                style={{
                  height: '100%',
                }}
              />
            </SandpackLayout>
            <form ref={formRef} onSubmit={handleSubmit}>
              <Textarea
                bg="white"
                ref={inputRef}
                name="prompt"
                required
                defaultValue="create a profile view for a user, the view should have 2 Tabs, one tab should have the basic user info like first name and last name, and the second should have a password reset form"
                placeholder="Enter your prompt..."
                my={2}
              />
              <Flex direction="row" justify="space-between">
                <Button size="lg" type="submit" isLoading={isLoading}>
                  Generate
                </Button>

                {sandpack?.error?.message && !isLoading && (
                  <Button
                    size="lg"
                    colorScheme="red"
                    type="button"
                    onClick={() => {
                      if (sandpack?.error?.message) {
                        handleFix(sandpack?.error?.message);
                      } else {
                        toast({
                          title: 'An error occurred.',
                          description: 'No error message found.',
                          status: 'error',
                          duration: 9000,
                          isClosable: true,
                        });
                      }
                    }}
                  >
                    Try to Fix
                  </Button>
                )}
              </Flex>
            </form>
          </Flex>
          <Stack
            width="30%"
            direction="column"
            overflowY="scroll"
            maxH="100%"
            px={4}
          >
            {commentary.map((item) => {
              return (
                <Box key={item.id} bg="white" p={3} borderRadius="md" w="100%">
                  {item.type === CommentaryType.ACTION && !item.body ? (
                    <SkeletonText noOfLines={1} />
                  ) : (
                    <Text fontSize="lg">{item.body}</Text>
                  )}
                  {item.type ? (
                    <Tag
                      colorScheme={(() => {
                        if (item.type === CommentaryType.ACTION) return 'blue';
                        if (item.type === CommentaryType.QUESTION)
                          return 'green';
                        if (item.type === CommentaryType.THOUGHT)
                          return 'yellow';
                        return 'gray';
                      })()}
                      mt={2}
                    >
                      {item.type.toLowerCase()}
                    </Tag>
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        </Flex>
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
  const [shouldRender, setShouldRender] = useState(false);
  const [sh, setSh] = useState(false);

  useEffect(() => {
    setShouldRender(true);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setSh(true);
      console.log('sh', sh);
    }, 10000);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <SandpackProvider
        template="react"
        customSetup={{
          dependencies: {
            ...initialCodebaseState.dependencies,
          },
        }}
        files={{
          '/App.js': {
            active: true,
            code: /* js */ `
      import React from 'react';


      export default function App() {
        return (
          // Code goes here!
          null
        );
      }
   `,
          },

          '/index.js': {
            active: false,
            hidden: true,
            code: /* js */ `
      import {ChakraProvider} from '@chakra-ui/react';
      import React, { StrictMode } from "react";
      import { createRoot } from "react-dom/client";
      import "./styles.css";

      import App from "./App";

      const root = createRoot(document.getElementById("root"));
      root.render(
        <StrictMode>
          <ChakraProvider>
            <App />
          </ChakraProvider>
        </StrictMode>
      );
    `,
          },
        }}
      >
        <Page />
      </SandpackProvider>
    </>
  );
}
