/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { DataSynchronizationResolverBootstrap } from './DataSynchronization/DataSynchronizationResolverBootstrap';
import { LocaleService } from './LocaleService';
import { NetworkStateNotificationService } from './NetworkStateNotification/NetworkStateNotificationService';
import { PluginBootstrap } from './PluginBootstrap';
import { ServerNodeChangedDialogService } from './ServerNodeChangedDialog/ServerNodeChangedDialogService';

export const rootPlugin: PluginManifest = {
  info: { name: 'Root plugin' },
  providers: [LocaleService, PluginBootstrap, ServerNodeChangedDialogService, NetworkStateNotificationService, DataSynchronizationResolverBootstrap],
};
