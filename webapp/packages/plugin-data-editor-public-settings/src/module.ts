/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry, Bootstrap } from '@cloudbeaver/core-di';
import { PluginDataEditorPublicSettingsBootstrap } from './PluginDataEditorPublicSettingsBootstrap.js';
import { LocaleService } from './LocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-editor-public-settings',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, LocaleService).addSingleton(Bootstrap, PluginDataEditorPublicSettingsBootstrap);
  },
});
