/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedDataResource } from '@cloudbeaver/core-resource';
import { DefaultNavigatorSettingsFragment, GraphQLService, NavigatorSettingsInput } from '@cloudbeaver/core-sdk';

import { isNavigatorViewSettingsEqual } from './ConnectionNavigatorViewSettings';
import { ServerConfigResource } from './ServerConfigResource';

export type DefaultNavigatorSettings = DefaultNavigatorSettingsFragment['defaultNavigatorSettings'];

@injectable()
export class DefaultNavigatorSettingsResource extends CachedDataResource<DefaultNavigatorSettings | null> {
  update: NavigatorSettingsInput;

  constructor(
    private readonly graphQLService: GraphQLService,
    serverConfigResource: ServerConfigResource,
  ) {
    super(() => null, undefined, []);
    this.sync(serverConfigResource);

    this.update = getDefaultNavigatorSettings();

    makeObservable<this, 'syncUpdateData'>(this, {
      update: observable,
      unlinkUpdate: action,
      syncUpdateData: action,
    });
  }

  isChanged(): boolean {
    if (!this.data) {
      return false;
    }

    return !isNavigatorViewSettingsEqual(this.data, this.update);
  }

  setDataUpdate(update: NavigatorSettingsInput): void {
    this.update = update;
  }

  resetUpdate(): void {
    if (this.data) {
      this.syncUpdateData(this.data);
    }
  }

  unlinkUpdate(): void {
    if (this.data) {
      Object.assign(this.update, this.data);
    } else {
      this.update = getDefaultNavigatorSettings();
    }
  }

  async save(): Promise<void> {
    await this.performUpdate(
      undefined,
      undefined,
      async () => {
        await this.graphQLService.sdk.setDefaultNavigatorSettings({ settings: this.update });

        this.setData(await this.loader());

        this.onDataOutdated.execute();
      },
      () => !this.isChanged(),
    );
  }

  protected async loader(): Promise<DefaultNavigatorSettings> {
    const { defaultNavigatorSettings } = await this.graphQLService.sdk.getDefaultNavigatorSettings();

    this.syncUpdateData(defaultNavigatorSettings.defaultNavigatorSettings);

    return defaultNavigatorSettings.defaultNavigatorSettings;
  }

  private syncUpdateData(defaultNavigatorSettings: DefaultNavigatorSettings) {
    Object.assign(this.update, defaultNavigatorSettings);
  }
}

function getDefaultNavigatorSettings(): NavigatorSettingsInput {
  return {
    hideFolders: false,
    hideSchemas: false,
    hideVirtualModel: false,
    mergeEntities: false,
    showOnlyEntities: false,
    showSystemObjects: false,
    showUtilityObjects: false,
  };
}
