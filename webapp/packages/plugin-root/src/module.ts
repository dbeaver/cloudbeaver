/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { DataSynchronizationResolverBootstrap } from './DataSynchronization/DataSynchronizationResolverBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { NetworkStateNotificationBootstrap } from './NetworkStateNotification/NetworkStateNotificationBootstrap.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ServerNodeChangedDialogBootstrap } from './ServerNodeChangedDialog/ServerNodeChangedDialogBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-root',

  bootstraps: () => [
    DataSynchronizationResolverBootstrap,
    PluginBootstrap,
    ServerNodeChangedDialogBootstrap,
    LocaleService,
    NetworkStateNotificationBootstrap,
  ],
});
