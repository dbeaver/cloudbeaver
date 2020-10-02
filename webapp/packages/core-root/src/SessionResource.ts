/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  SessionInfo,
  ConnectionInfo
} from '@cloudbeaver/core-sdk';

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
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super(null);
  }

  isLoaded() {
    return !!this.data;
  }

  async update() {
    await this.refresh(null);
  }

  protected async loader(key: null): Promise<SessionState> {
    const { session } = await this.graphQLService.sdk.openSession();

    this.markUpdated(key);
    return session;
  }
}
