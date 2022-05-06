/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';


import { ClipboardBootstrap } from './Clipboard/ClipboardBootstrap';
import { ClipboardService } from './Clipboard/ClipboardService';
import { LocaleService } from './LocaleService';
import { NavigationService } from './Screens/AppScreen/NavigationService';
import { OptionsPanelService } from './Screens/AppScreen/OptionsPanelService';
import { SideBarPanelService } from './SideBarPanel/SideBarPanelService';
import { TabsBootstrap } from './Tabs/TabsBootstrap';

export const manifest: PluginManifest = {
  info: {
    name: 'Core UI',
  },

  providers: [
    NavigationService,
    OptionsPanelService,
    ClipboardBootstrap,
    ClipboardService,
    TabsBootstrap,
    SideBarPanelService,
    LocaleService,
  ],
};
