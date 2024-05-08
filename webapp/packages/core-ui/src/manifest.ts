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
    () => import('./Screens/AppScreen/NavigationService').then(m => m.NavigationService),
    () => import('./Screens/AppScreen/OptionsPanelService').then(m => m.OptionsPanelService),
    () => import('./Clipboard/ClipboardBootstrap').then(m => m.ClipboardBootstrap),
    () => import('./Clipboard/ClipboardService').then(m => m.ClipboardService),
    () => import('./Tabs/TabsBootstrap').then(m => m.TabsBootstrap),
    () => import('./SideBarPanel/SideBarPanelService').then(m => m.SideBarPanelService),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./SideBarPanel/LeftBarPanelService').then(m => m.LeftBarPanelService),
  ],
};
