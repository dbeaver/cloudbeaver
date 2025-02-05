/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { type DefaultNavigatorSettingsFragment, GraphQLService, type NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource.js';

export type DefaultNavigatorSettings = DefaultNavigatorSettingsFragment['defaultNavigatorSettings'];

@injectable()
export class DefaultNavigatorSettingsResource extends CachedDataResource<DefaultNavigatorSettings | null> {
  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);
  }

  async save(settings: NavigatorSettingsInput): Promise<void> {
    await this.performUpdate(undefined, undefined, async () => {
      await this.graphQLService.sdk.setDefaultNavigatorSettings({ settings });
      this.setData(await this.loader());
      this.onDataOutdated.execute();
    });
  }

  protected async loader(): Promise<DefaultNavigatorSettings> {
    const { defaultNavigatorSettings } = await this.graphQLService.sdk.getDefaultNavigatorSettings();
    return defaultNavigatorSettings.defaultNavigatorSettings;
  }
}
