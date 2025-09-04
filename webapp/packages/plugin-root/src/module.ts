/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ServerNodeChangedDialogBootstrap } from './ServerNodeChangedDialog/ServerNodeChangedDialogBootstrap.js';
import { NetworkStateNotificationBootstrap } from './NetworkStateNotification/NetworkStateNotificationBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { DataSynchronizationResolverBootstrap } from './DataSynchronization/DataSynchronizationResolverBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-root',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, DataSynchronizationResolverBootstrap)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, ServerNodeChangedDialogBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, NetworkStateNotificationBootstrap);
  },
});
