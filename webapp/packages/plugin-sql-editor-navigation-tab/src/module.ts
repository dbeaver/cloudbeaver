/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { SqlEditorTabService } from './SqlEditorTabService.js';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService.js';
import { SqlEditorBootstrap } from './SqlEditorBootstrap.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor-navigation-tab',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(SqlEditorBootstrap))
      .addSingleton(Bootstrap, proxy(SqlEditorTabService))
      .addSingleton(SqlEditorTabService)
      .addSingleton(SqlEditorBootstrap)
      .addSingleton(SqlEditorNavigatorService);
  },
});
