/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { RouterService } from './RouterService';
import { ScreenService } from './Screen/ScreenService';
import { WindowsService } from './WindowsService';

export const coreRoutingManifest: PluginManifest = {
  info: {
    name: 'Core Routing',
  },

  providers: [ScreenService, RouterService, WindowsService],
};
