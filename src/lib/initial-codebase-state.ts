import {SandpackFiles} from '@codesandbox/sandpack-react';

const AppJs = /* js */ `import React from 'react';

export default function App() {
  return (
    // Code goes here!
    null
  );
}`;

const IndexJs = /* js */ `import {ChakraProvider} from '@chakra-ui/react';
  import React, { StrictMode } from "react";
  import { createRoot } from "react-dom/client";

  import App from "./App";

  const root = createRoot(document.getElementById("root"));
  root.render(
    <StrictMode>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </StrictMode>
  );
  `;

export const initialCodebaseState: {
  files: SandpackFiles;
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
