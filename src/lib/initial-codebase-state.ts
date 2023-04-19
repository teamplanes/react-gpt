import {SandpackFile} from '@codesandbox/sandpack-react';

const AppJs = /* js */ `import React from 'react';
import {ChakraProvider} from '@chakra-ui/react';

export default function App() {
  return (
    <ChakraProvider>
      {/* code goes here */}
    </ChakraProvider>
  );
}`;

const IndexJs = /* js */ `
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {ChakraProvider} from '@chakra-ui/react';

import App from "./App";

const root = createRoot(document.getElementById("root"));
root.render(
  <ChakraProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </ChakraProvider>
);
`;

export const initialCodebaseState: {
  files: Record<string, SandpackFile>;
  dependencies: Record<string, string>;
} = {
  files: {
    '/App.js': {
      active: true,
      hidden: false,
      code: AppJs,
    },
    '/index.js': {
      active: false,
      hidden: true,
      code: IndexJs,
    },
  },
  dependencies: {
    '@chakra-ui/react': 'latest',
    '@emotion/react': 'latest',
    '@emotion/styled': 'latest',
    'framer-motion': 'latest',
    'react-icons': 'latest',
  },
};
