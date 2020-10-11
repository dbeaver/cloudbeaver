/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  SessionInfo,
  ConnectionInfo
} from '@cloudbeaver/core-sdk';

import { ServerConfigResource } from './ServerConfigResource';

export type SessionState = Pick<SessionInfo, 'createTime' | 'cacheExpired' | 'lastAccessTime' | 'locale'> & {
  connections: Array<Pick<
  ConnectionInfo,
  'id' |
  'name' |
  'description' |
  'connected' |
  'readOnly' |
  'driverId' |
  'authModel' |
  'authNeeded' |
  'features' |
  'supportedDataFormats'
  >>;
};

@injectable()
export class SessionResource extends CachedDataResource<SessionState | null, null> {
  @observable
  private loaded: boolean;

  constructor(
    private graphQLService: GraphQLService,
    private serverConfiguration: ServerConfigResource
  ) {
    super(null);
    this.serverConfiguration.onDataOutdated.subscribe(this.markOutdated.bind(this));
    this.serverConfiguration.onDataUpdate.subscribe(() => this.load(null));
    this.loaded = false;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  async update(): Promise<void> {
    await this.refresh(null);
  }

  protected async loader(key: null): Promise<SessionState> {
    await this.serverConfiguration.load(null);

    const { session } = await this.graphQLService.sdk.openSession();

    this.loaded = true;
    return session;
  }
}
