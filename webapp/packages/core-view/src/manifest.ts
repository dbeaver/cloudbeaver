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
    name: 'Core View',
  },

  providers: [
    () => import('./Action/ActionService.js').then(m => m.ActionService),
    () => import('./Action/KeyBinding/KeyBindingService.js').then(m => m.KeyBindingService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./Menu/MenuService.js').then(m => m.MenuService),
    () => import('./View/ViewService.js').then(m => m.ViewService),
  ],
};
