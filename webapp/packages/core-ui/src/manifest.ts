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
    name: 'Core UI',
  },

  providers: [
    () => import('./Screens/AppScreen/NavigationService.js').then(m => m.NavigationService),
    () => import('./Screens/AppScreen/OptionsPanelService.js').then(m => m.OptionsPanelService),
    () => import('./Clipboard/ClipboardBootstrap.js').then(m => m.ClipboardBootstrap),
    () => import('./Clipboard/ClipboardService.js').then(m => m.ClipboardService),
    () => import('./Tabs/TabsBootstrap.js').then(m => m.TabsBootstrap),
    () => import('./SideBarPanel/SideBarPanelService.js').then(m => m.SideBarPanelService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./SideBarPanel/LeftBarPanelService.js').then(m => m.LeftBarPanelService),
  ],
};
