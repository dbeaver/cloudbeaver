/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { ResourceSqlDataSourceBootstrap } from './ResourceSqlDataSourceBootstrap.js';
import { SqlEditorTabResourceService } from './SqlEditorTabResourceService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ResourceEditorSettingsService } from './ResourceEditorSettingsService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor-navigation-tab-script',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(ResourceEditorSettingsService))
      .addSingleton(Bootstrap, ResourceSqlDataSourceBootstrap)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(ResourceEditorSettingsService)
      .addSingleton(SqlEditorTabResourceService);
  },
});
