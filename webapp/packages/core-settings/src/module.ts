/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { SettingsManagerService } from './SettingsManager/SettingsManagerService.js';
import { SettingsProviderService } from './SettingsProviderService.js';
import { SettingsResolverService } from './SettingsResolverService.js';
import { UserSettingsResolverService } from './UserSettingsResolverService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-settings',

  services: () => [UserSettingsResolverService, SettingsResolverService, SettingsProviderService, SettingsManagerService],
  bootstraps: () => [LocaleService],
});
