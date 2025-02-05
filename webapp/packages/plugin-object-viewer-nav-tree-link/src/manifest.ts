/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const objectViewerNavTreeLinkPlugin: PluginManifest = {
  info: { name: 'Object Viewer Nav Tree link' },
  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ObjectViewerNavTreeLinkMenuService.js').then(m => m.ObjectViewerNavTreeLinkMenuService),
  ],
};
