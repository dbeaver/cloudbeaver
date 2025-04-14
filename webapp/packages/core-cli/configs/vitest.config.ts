/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    root: path.resolve('.'),
    include: ['**/lib/**/*.test.js'],
    exclude: ['node_modules/**'],
    setupFiles: [path.resolve(__dirname, './vitest.setup.ts')],
    alias: [
      {
        find: /.*.(css|scss|less)$/,
        replacement: path.resolve(__dirname, './__mocks__/styleMock.js'),
      },
    ],
    isolate: false,
    poolOptions: {
      forks: {
        isolate: false,
      },
    },
    fileParallelism: false,
    css: false,
    watch: false,
    environmentOptions: {
      // This will force JSDOM to use the default export condition when importing msw/node, resulting in correct imports.
      // https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
      customExportConditions: [''],
    },
  },
  esbuild: false,
});
