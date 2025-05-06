/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { mergeConfig, defineConfig } from 'vitest/config';
import { DefaultVitestConfig } from '@dbeaver/cli';

export default mergeConfig(
  DefaultVitestConfig,
  defineConfig({
    test: {
      environment: 'happy-dom',
      setupFiles: [import.meta.resolve('./vitest.setup.js')],
      alias: [
        {
          find: /.*.(css|scss|less)$/,
          replacement: import.meta.resolve('./__mocks__/styleMock.js'),
        },
      ],
      css: false,
    },
  }),
);
