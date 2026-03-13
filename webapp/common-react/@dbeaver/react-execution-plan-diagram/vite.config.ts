/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/standalone.tsx',
      output: {
        entryFileNames: 'execution-plan-diagram.js',
        assetFileNames: 'execution-plan-diagram.css',
      },
    },
  },
});
