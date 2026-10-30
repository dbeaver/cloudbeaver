/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { defineConfig, globalIgnores } from 'eslint/config';
import cloudbeaverConfig from '@cloudbeaver/eslint-config/flat.js';

export default defineConfig(
  globalIgnores(['**/*', '!packages/', '!packages/**', '**/node_modules/', '**/lib/', '**/dist/', '**/coverage/', '**/allure-results/']),
  cloudbeaverConfig,
);
