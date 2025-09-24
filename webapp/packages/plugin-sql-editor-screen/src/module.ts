/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { SqlEditorScreenSettingsService } from './SqlEditorScreenSettingsService.js';
import { SqlEditorScreenBootstrap } from './Screen/SqlEditorScreenBootstrap.js';
import { SqlEditorScreenService } from './Screen/SqlEditorScreenService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor-screen',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(SqlEditorScreenSettingsService))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, SqlEditorScreenBootstrap)
      .addSingleton(SqlEditorScreenSettingsService)
      .addSingleton(SqlEditorScreenService);
  },
});
