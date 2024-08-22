/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreDialogsManifest: PluginManifest = {
  info: {
    name: 'Core Dialogs',
  },

  providers: [
    () => import('./CommonDialog/CommonDialogService').then(m => m.CommonDialogService),
    () => import('./Menu/ContextMenu/ContextMenuService').then(m => m.ContextMenuService),
  ],
};
