/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ConnectionSearchSettingsService } from './ConnectionSearchSettingsService.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionSearchService } from './Search/ConnectionSearchService.js';
import { SearchConnectionPluginBootstrap } from './SearchConnectionPluginBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-search',

  services: () => [ConnectionSearchSettingsService, ConnectionSearchService],
  bootstraps: () => [SearchConnectionPluginBootstrap, LocaleService],
});
