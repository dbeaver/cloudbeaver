/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { SQLCodeEditorPanelService } from './SQLEditor/SQLCodeEditorPanel/SQLCodeEditorPanelService.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor-new',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, LocaleService).addSingleton(Bootstrap, PluginBootstrap).addSingleton(SQLCodeEditorPanelService);
  },
});
