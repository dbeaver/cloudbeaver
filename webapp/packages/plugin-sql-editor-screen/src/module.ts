/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { SqlEditorScreenBootstrap } from './Screen/SqlEditorScreenBootstrap.js';
import { SqlEditorScreenService } from './Screen/SqlEditorScreenService.js';
import { SqlEditorScreenSettingsService } from './SqlEditorScreenSettingsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-sql-editor-screen',

  services: () => [SqlEditorScreenSettingsService, SqlEditorScreenService],
  bootstraps: () => [LocaleService, PluginBootstrap, SqlEditorScreenBootstrap],
});
