/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { BlocksLocaleService } from './BlocksLocaleService';

export const coreBlocksManifest: PluginManifest = {
  info: {
    name: 'Core Blocks',
  },

  providers: [
    BlocksLocaleService,
  ],
};
