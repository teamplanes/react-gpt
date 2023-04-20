import {Task} from '@/lib/agent/types';
import {Box, Card, Stack, Tag, Text} from '@chakra-ui/react';
import {useMemo} from 'react';

export function TaskCard(props: {
  task: Task;
  isLoading: boolean;
  result?: string;
}) {
  const bg = useMemo(() => {
    if (props.isLoading) {
      return 'gray.900';
    }
    if (props.result) {
      return 'green.700';
    }
    return 'gray.600';
  }, [props.isLoading, props.result]);

  const result = useMemo(() => {
    if (!props.result) {
      return null;
    }

    if (
      props.result.startsWith('ToolSuccess') ||
      props.result.startsWith('ToolInfoRetrieval')
    ) {
      return 'Tool ran successfully';
    }

    return 'Tool failed, agent has been informed';
  }, [props.result]);

  return (
    <Card
      bg={bg}
      p={4}
      borderRadius="md"
      color="white"
      fontFamily="mono"
      fontSize="sm"
    >
      <Stack>
        <Tag bg="rgba(0,0,0,0.2)" color="white" fontSize="xs">
          {props.task.tool_name}
        </Tag>
        <Text
          as="div"
          fontSize="md"
          lineHeight={1.5}
          color="white"
          whiteSpace="pre-wrap"
        >
          {props.task.task_name}
        </Text>
        {props.isLoading && (
          <Text as="div" fontSize="sm" color="white" whiteSpace="pre-wrap">
            <Box as="span" color="yellow.400">
              ⏳
            </Box>{' '}
            Running...
          </Text>
        )}
        {result && (
          <Text
            as="div"
            fontSize="sm"
            color="rgb(255, 255, 255, 0.5)"
            whiteSpace="pre-wrap"
          >
            {props.result?.startsWith('ToolError') && <>😔</>} {result}
          </Text>
        )}
      </Stack>
    </Card>
  );
}
