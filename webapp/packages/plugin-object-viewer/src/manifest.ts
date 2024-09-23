/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const objectViewerManifest: PluginManifest = {
  info: { name: 'Object Viewer Plugin' },

  providers: [
    () => import('./ObjectViewerBootstrap.js').then(m => m.ObjectViewerBootstrap),
    () => import('./ObjectPropertiesPage/NavNodeView/NavNodeMetadata/NavNodeMetadataViewBootstrap.js').then(m => m.NavNodeMetadataViewBootstrap),
    () => import('./ObjectPropertiesPage/NavNodeView/VirtualFolder/VirtualFolderViewBootstrap.js').then(m => m.VirtualFolderViewBootstrap),
    () => import('./ObjectPropertiesPage/ObjectPropertiesPageService.js').then(m => m.ObjectPropertiesPageService),
    () => import('./ObjectViewerTabService.js').then(m => m.ObjectViewerTabService),
    () => import('./ObjectPage/DBObjectPageService.js').then(m => m.DBObjectPageService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService.js').then(m => m.ObjectPropertyTableFooterService),
  ],
};
