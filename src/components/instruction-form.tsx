/* eslint-disable react/require-default-props */
import {Textarea, Flex, Button} from '@chakra-ui/react';

interface PromptFormProps {
  isLoading: boolean;
  onSubmit: () => void;
  onChange: (instruction: string) => void;
  instruction: string;
}

export function PromptForm(props: PromptFormProps) {
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
      </Flex>
    </form>
  );
}
