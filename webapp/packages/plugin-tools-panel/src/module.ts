/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ToolsPanelSettingsService } from './ToolsPanelSettingsService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ToolsPanelService } from './ToolsPanel/ToolsPanelService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-tools-panel',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ToolsPanelSettingsService))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(ToolsPanelSettingsService)
      .addSingleton(ToolsPanelService);
  },
});
