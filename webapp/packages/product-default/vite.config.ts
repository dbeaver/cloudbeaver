/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/// <reference types="node" />
import { defineConfig, UserConfig } from 'vite';

import { baseConfigurationPlugin } from '@cloudbeaver/product-base';

import packageJson from './package.json';

export default defineConfig(
  ({ mode }): UserConfig => ({
    plugins: [baseConfigurationPlugin(mode, packageJson)],
  }),
);
