/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { DdlViewerBootstrap } from './DdlViewerBootstrap';
import { DdlViewerService } from './DdlViewerService';
import { DdlViewerTabService } from './DdlViewerTabService';

export const manifest: PluginManifest = {
  info: {
    name: 'DDL Viewer Plugin',
  },

  providers: [
    DdlViewerBootstrap,
    DdlViewerTabService,
    DdlViewerService,
  ],
};
