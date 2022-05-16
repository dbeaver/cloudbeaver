/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { FeaturesResource } from './FeaturesResource';
import { NetworkStateService } from './NetworkStateService';
import { PermissionsResource } from './PermissionsResource';
import { PermissionsService } from './PermissionsService';
import { ServerConfigResource } from './ServerConfigResource';
import { ServerService } from './ServerService';
import { ServerSettingsService } from './ServerSettingsService';
import { SessionActionService } from './SessionActionService';
import { SessionDataResource } from './SessionDataResource';
import { SessionExpireService } from './SessionExpireService';
import { SessionResource } from './SessionResource';
import { SessionService } from './SessionService';
import { SessionSettingsService } from './SessionSettingsService';
import { WindowEventsService } from './WindowEventsService';


export const manifest: PluginManifest = {
  info: {
    name: 'Core Root',
  },

  providers: [
    FeaturesResource,
    NetworkStateService,
    PermissionsResource,
    PermissionsService,
    ServerConfigResource,
    ServerService,
    ServerSettingsService,
    SessionActionService,
    SessionDataResource,
    SessionExpireService,
    SessionResource,
    SessionService,
    SessionSettingsService,
    WindowEventsService,
  ],
};
