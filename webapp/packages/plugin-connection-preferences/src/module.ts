/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';

import { ConnectionPreferencesBootstrap } from './ConnectionPreferencesBootstrap.js';
import { ConnectionPreferencesInfoResource } from './ConnectionPreferencesForm/ConnectionPreferencesFormInfo/ConnectionPreferencesInfoResource.js';
import { ConnectionPreferencesInfoTabService } from './ConnectionPreferencesForm/ConnectionPreferencesFormInfo/ConnectionPreferencesInfoTabService.js';
import { ConnectionPreferencesFormService } from './ConnectionPreferencesForm/ConnectionPreferencesFormService.js';
import { ConnectionPreferencesPanelService } from './ConnectionPreferencesPanelService.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-preferences',

  services: () => [
    ConnectionPreferencesInfoTabService,
    ConnectionPreferencesBootstrap,
    ConnectionPreferencesPanelService,
    ConnectionPreferencesFormService,
    ConnectionPreferencesInfoResource,
  ],
  bootstraps: () => [LocaleService, ConnectionPreferencesBootstrap, ConnectionPreferencesInfoTabService],
});
