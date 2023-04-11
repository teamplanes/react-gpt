import {CodebaseState} from './types';

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

  import App from "./src/App";

  const root = createRoot(document.getElementById("root"));
  root.render(
    <StrictMode>
      <ChakraProvider>
        <App />
      </ChakraProvider>
    </StrictMode>
  );
  `;

export const initialCodebaseState: CodebaseState = {
  files: [
    {
      editor: {
        isActive: true,
        isHidden: false,
      },
      path: '/src/App.js',
      code: AppJs,
    },
    {
      editor: {
        isActive: false,
        isHidden: true,
      },
      path: '/index.js',
      code: IndexJs,
    },
  ],
  dependencies: {
    '@chakra-ui/react': 'latest',
    '@emotion/react': 'latest',
    '@emotion/styled': 'latest',
    'framer-motion': 'latest',
    'react-icons': 'latest',
  },
};
