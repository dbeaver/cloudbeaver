/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, runInAction } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, CachedMapResource, GraphQLService, isResourceKeyList, ResourceKey } from '@cloudbeaver/core-sdk';

import { UserInfoResource } from './UserInfoResource';

@injectable()
export class UserConfigurationParametersResource extends CachedMapResource<string, any> {
  get parametersAvailable() {
    return this.userInfoResource.data !== null;
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    super();

    this.userInfoResource.authenticationChange.addHandler(data => {
      if (data === 'logout') {
        this.data.clear();
      }
    });

    this.userInfoResource.onDataUpdate.addHandler(this.loadAll.bind(this));
    this.userInfoResource.onDataOutdated.addHandler(this.markOutdated.bind(this));

    makeObservable(this, {
      parametersAvailable: computed,
    });
  }

  async loadAll(): Promise<Map<string, any>> {
    await this.load(CachedMapAllKey);
    return this.data;
  }

  async add(key: string, value: any): Promise<Map<string, any>> {
    await this.graphQLService.sdk.setUserConfigurationParameter({
      name: key,
      value,
    });

    this.data.set(key, value);
    return this.data;
  }

  async delete(key: ResourceKey<string>): Promise<Map<string, any>> {
    if (isResourceKeyList(key)) {
      const keyList: string[] = [];
      for (const item of key.list) {
        await this.graphQLService.sdk.setUserConfigurationParameter({
          name: item,
          value: null,
        });

        keyList.push(item);
      }

      runInAction(() => {
        for (const item of keyList) {
          this.data.delete(item);
        }
      });
    } else {
      await this.graphQLService.sdk.setUserConfigurationParameter({
        name: key,
        value: null,
      });

      this.data.delete(key);
    }

    return this.data;
  }

  protected async loader(): Promise<Map<string, any>> {
    const user = await this.userInfoResource.load(undefined, ['includeConfigurationParameters']);

    runInAction(() => {
      this.data.clear();

      if (user?.configurationParameters) {
        for (const [key, value] of Object.entries(user.configurationParameters)) {
          this.data.set(key, value);
        }
      }
    });

    return this.data;
  }
}
