/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';
import { TabsBootstrap } from './Tabs/TabsBootstrap';

import { ClipboardBootstrap } from './Clipboard/ClipboardBootstrap';
import { ClipboardService } from './Clipboard/ClipboardService';
import { NavigationService } from './Screens/AppScreen/NavigationService';
import { OptionsPanelService } from './Screens/AppScreen/OptionsPanelService';

export const manifest: PluginManifest = {
  info: {
    name: 'Core UI',
  },

  providers: [
    NavigationService,
    OptionsPanelService,
    ClipboardBootstrap,
    ClipboardService,
    TabsBootstrap
  ],
};
