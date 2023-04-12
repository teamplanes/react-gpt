/* eslint-disable react/require-default-props */
import {Textarea, Flex, Button, useToast} from '@chakra-ui/react';

interface PromptFormProps {
  isLoading: boolean;
  onSubmit: () => void;
  onChange: (instruction: string) => void;
  onFix: (error: string) => void;
  instruction: string;
  errorMessage?: string | undefined;
}

export function PromptForm(props: PromptFormProps) {
  const toast = useToast();
  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    props.onSubmit();
  };
  return (
    <form onSubmit={handleSubmit}>
      <Textarea
        bg="white"
        value={props.instruction}
        onChange={(e) => props.onChange(e.target.value)}
        name="prompt"
        required
        // defaultValue="create a profile view for a user, the view should have 2 Tabs, one tab should have the basic user info like first name and last name, and the second should have a password reset form"
        placeholder="Enter your instruction..."
        my={2}
      />
      <Flex direction="row" justify="space-between">
        <Button size="lg" type="submit" isLoading={props.isLoading}>
          Run
        </Button>

        {props.errorMessage && !props.isLoading && (
          <Button
            size="lg"
            colorScheme="red"
            type="button"
            onClick={() => {
              if (props.errorMessage) {
                props.onFix(props.errorMessage);
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
  );
}
