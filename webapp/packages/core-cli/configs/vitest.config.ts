/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { mergeConfig } from 'vitest/config';
import { BaseVitestConfig } from '@dbeaver/tests-runner';
import path from 'path';

export default mergeConfig(BaseVitestConfig, {
  test: {
    environment: 'happy-dom',
    setupFiles: [path.resolve(__dirname, './vitest.setup.ts')],
    alias: [
      {
        find: /.*.(css|scss|less)$/,
        replacement: path.resolve(__dirname, './__mocks__/styleMock.js'),
      },
    ],
    css: false,
  },
});
