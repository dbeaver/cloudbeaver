/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { DdlResource } from './DdlViewer/DdlResource';
import { DDLViewerFooterService } from './DdlViewer/DDLViewerFooterService';
import { DdlViewerBootstrap } from './DdlViewerBootstrap';
import { ExtendedDDLResource } from './ExtendedDDLViewer/ExtendedDDLResource';

export const manifest: PluginManifest = {
  info: {
    name: 'DDL Viewer Plugin',
  },

  providers: [DdlViewerBootstrap, DDLViewerFooterService, ExtendedDDLResource, DdlResource],
};
