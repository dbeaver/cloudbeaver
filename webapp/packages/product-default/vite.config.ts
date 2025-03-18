/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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
    /*
    Fixes https://github.com/dbeaver/cloudbeaver/issues/3308
    ROOT_URI approach for assets doesn't work well when we serve our application not from a root folder. In that case inner Vite asset handling system add indices to CSS files using absolute path ignoring injected ROOT_URI. When using relative path in base property, we ask Vite to generate paths relatively to each file https://vite.dev/guide/build#public-base-path.  */
    base: './',
    plugins: [baseConfigurationPlugin(mode, packageJson)],
  }),
);
