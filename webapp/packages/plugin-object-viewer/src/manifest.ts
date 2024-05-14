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
    () => import('./ObjectViewerBootstrap').then(m => m.ObjectViewerBootstrap),
    () => import('./ObjectPropertiesPage/NavNodeView/NavNodeMetadata/NavNodeMetadataViewBootstrap').then(m => m.NavNodeMetadataViewBootstrap),
    () => import('./ObjectPropertiesPage/NavNodeView/VirtualFolder/VirtualFolderViewBootstrap').then(m => m.VirtualFolderViewBootstrap),
    () => import('./ObjectPropertiesPage/ObjectPropertiesPageService').then(m => m.ObjectPropertiesPageService),
    () => import('./ObjectViewerTabService').then(m => m.ObjectViewerTabService),
    () => import('./ObjectPage/DBObjectPageService').then(m => m.DBObjectPageService),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService').then(m => m.ObjectPropertyTableFooterService),
  ],
};
