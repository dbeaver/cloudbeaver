/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { EAdminPermission, ServerConfigResource, SessionPermissionsResource } from '@cloudbeaver/core-root';
import { GraphQLService, type AiSettingsConfig, type AiSettingsInfo } from '@cloudbeaver/core-sdk';
import { isObjectsEqual } from '@cloudbeaver/core-utils';

@injectable(() => [GraphQLService, SessionPermissionsResource, ServerConfigResource])
export class AISettingsResource extends CachedDataResource<AiSettingsInfo | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    permissionsResource: SessionPermissionsResource,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null);

    this.sync(serverConfigResource);

    permissionsResource.require(this, EAdminPermission.admin).outdateResource(this);
  }

  async saveSettings(settings: AiSettingsConfig) {
    await this.performUpdate(undefined, undefined, async () => {
      const { result } = await this.graphQLService.sdk.saveAiSettings({
        settings,
      });

      this.setData(result);
      this.onDataOutdated.execute();

      return true;
    });
  }

  isChanged(settings: AiSettingsConfig) {
    if (!this.data) {
      return false;
    }

    return !isObjectsEqual(settings, this.data);
  }

  protected async loader() {
    const { settings } = await this.graphQLService.sdk.getAiSettings();
    return settings;
  }
}
