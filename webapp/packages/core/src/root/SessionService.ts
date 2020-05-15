/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import {
  ConnectionInfo, GraphQLService, SessionInfo, CachedResource,
} from '@dbeaver/core/sdk';

import { SessionSettingsService } from '../settings/SessionSettingsService';

export type SessionState = Pick<SessionInfo, 'createTime' | 'cacheExpired' | 'lastAccessTime' | 'locale'> & {
  connections: Array<Pick<ConnectionInfo, 'id' | 'name' | 'connected' | 'driverId'>>;
};

@injectable()
export class SessionService {
  readonly session = new CachedResource(undefined, this.refreshSessionStateAsync.bind(this), data => !!data);
  readonly settings = new SessionSettingsService('session_settings');

  constructor(private graphQLService: GraphQLService) {}

  private async refreshSessionStateAsync(data: SessionState | undefined): Promise<SessionState> {
    const { session } = await this.graphQLService.gql.openSession();

    return session;
  }
}
