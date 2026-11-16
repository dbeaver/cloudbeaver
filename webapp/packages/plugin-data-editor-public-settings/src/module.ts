/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { PluginDataEditorPublicSettingsBootstrap } from './PluginDataEditorPublicSettingsBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-editor-public-settings',

  bootstraps: () => [LocaleService, PluginDataEditorPublicSettingsBootstrap],
});
