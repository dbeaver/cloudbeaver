/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { TabsBootstrap } from './Tabs/TabsBootstrap.js';
import { SideBarPanelService } from './SideBarPanel/SideBarPanelService.js';
import { LeftBarPanelService } from './SideBarPanel/LeftBarPanelService.js';
import { NavigationService } from './Screens/AppScreen/NavigationService.js';
import { OptionsPanelService } from './Screens/AppScreen/OptionsPanelService.js';
import { LocaleService } from './LocaleService.js';
import { ClipboardBootstrap } from './Clipboard/ClipboardBootstrap.js';
import { ClipboardService } from './Clipboard/ClipboardService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-ui',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ClipboardBootstrap))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(TabsBootstrap))
      .addSingleton(ClipboardService)
      .addSingleton(TabsBootstrap)
      .addSingleton(SideBarPanelService)
      .addSingleton(LeftBarPanelService)
      .addSingleton(NavigationService)
      .addSingleton(OptionsPanelService)
      .addSingleton(ClipboardBootstrap);
  },
});
