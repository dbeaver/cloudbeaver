/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';

import { ConnectionPreferencesBootstrap } from './ConnectionPreferencesBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionPreferencesPanelService } from './ConnectionPreferencesPanelService.js';
import { ConnectionPreferencesFormService } from './ConnectionPreferencesForm/ConnectionPreferencesFormService.js';
import { ConnectionPreferencesInfoTabService } from './ConnectionPreferencesForm/ConnectionPreferencesFormInfo/ConnectionPreferencesInfoTabService.js';
import { ConnectionPreferencesInfoResource } from './ConnectionPreferencesForm/ConnectionPreferencesFormInfo/ConnectionPreferencesInfoResource.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connection-preferences',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, proxy(ConnectionPreferencesBootstrap))
      .addSingleton(Bootstrap, proxy(ConnectionPreferencesInfoTabService))
      .addSingleton(ConnectionPreferencesInfoTabService)
      .addSingleton(ConnectionPreferencesBootstrap)
      .addSingleton(ConnectionPreferencesPanelService)
      .addSingleton(ConnectionPreferencesFormService)
      .addSingleton(ConnectionPreferencesInfoResource);
  },
});
