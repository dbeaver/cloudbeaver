/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    root: path.resolve('.'),
    include: [
      // unix
      'packages/*/lib/**/*.{spec,test}.{js,jsx}',
      'lib/**/*.{spec,test}.{js,jsx}',
      // windows
      'packages\\*\\lib\\**\\*.{spec,test}.{js,jsx}',
      'lib\\**\\*.{spec,test}.{js,jsx}',
    ],
    exclude: ['node_modules/**', '\\.pnp\\.[^\\/]+$'],
    setupFiles: [path.resolve(__dirname, './vitest.setup.ts')],
    alias: [
      {
        find: /.*.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)%/,
        replacement: path.resolve(__dirname, './__mocks__/fileMock.js'),
      },
      {
        find: /.*.(css|scss|less)$/,
        replacement: path.resolve(__dirname, './__mocks__/styleMock.js'),
      },
    ],
    globals: true,
    watch: false,
    environmentOptions: {
      // This will force JSDOM to use the default export condition when importing msw/node, resulting in correct imports.
      // https://mswjs.io/docs/migrations/1.x-to-2.x#cannot-find-module-mswnode-jsdom
      customExportConditions: [''],
    },
  },
});
