/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ServerConfigurationFeatureGroupsService } from '@cloudbeaver/core-administration';
import { ConnectionTypeResource, FEATURE_GROUP_CONNECTIONS_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { FEATURE_RESET_CREDENTIALS_ON_TARGET_CHANGE_ID } from './FEATURE_RESET_CREDENTIALS_ON_TARGET_CHANGE_ID.js';

@injectable(() => [ServerConfigurationFeatureGroupsService, ConnectionTypeResource])
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly serverConfigurationFeatureGroupsService: ServerConfigurationFeatureGroupsService) {
    super();
  }

  override register(): void {
    this.serverConfigurationFeatureGroupsService.assignFeaturesToGroup(FEATURE_GROUP_CONNECTIONS_ID, [FEATURE_RESET_CREDENTIALS_ON_TARGET_CHANGE_ID]);
  }

  override async load(): Promise<void> {}
}
