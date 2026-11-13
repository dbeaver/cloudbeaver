/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ClipboardBootstrap } from './Clipboard/ClipboardBootstrap.js';
import { ClipboardService } from './Clipboard/ClipboardService.js';
import { LocaleService } from './LocaleService.js';
import { NavigationService } from './Screens/AppScreen/NavigationService.js';
import { OptionsPanelService } from './Screens/AppScreen/OptionsPanelService.js';
import { LeftBarPanelService } from './SideBarPanel/LeftBarPanelService.js';
import { SideBarPanelService } from './SideBarPanel/SideBarPanelService.js';
import { TabsBootstrap } from './Tabs/TabsBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-ui',

  services: () => [
    ClipboardService,
    TabsBootstrap,
    SideBarPanelService,
    LeftBarPanelService,
    NavigationService,
    OptionsPanelService,
    ClipboardBootstrap,
  ],
  bootstraps: () => [ClipboardBootstrap, LocaleService, TabsBootstrap],
});
