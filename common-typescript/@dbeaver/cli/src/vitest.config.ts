/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/lib/**/*.test.js'],
    exclude: ['node_modules/**'],
    isolate: false,
    poolOptions: {
      forks: {
        isolate: false,
      },
    },
    fileParallelism: false,
    watch: false,
    environmentOptions: {
      // This will force JSDOM to use the default export condition when importing msw/node, resulting in correct imports.
      // https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
      customExportConditions: [''],
    },
  },
  esbuild: false,
});
