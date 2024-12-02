/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const manifest: PluginManifest = {
  info: {
    name: 'DDL Viewer Plugin',
  },

  providers: [
    () => import('./DdlViewerBootstrap.js').then(m => m.DdlViewerBootstrap),
    () => import('./DdlViewer/DDLViewerFooterService.js').then(m => m.DDLViewerFooterService),
    () => import('./ExtendedDDLViewer/ExtendedDDLResource.js').then(m => m.ExtendedDDLResource),
    () => import('./DdlViewer/DdlResource.js').then(m => m.DdlResource),
  ],
};
