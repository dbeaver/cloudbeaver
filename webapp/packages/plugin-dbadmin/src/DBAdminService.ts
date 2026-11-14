/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import {
  type DbAdminGetInfoQuery,
  type DbAdminGetLockDetailsQuery,
  type DbAdminListLocksQuery,
  type DbAdminListSessionsQuery,
  GraphQLService,
} from '@cloudbeaver/core-sdk';

export type DBAdminInfo = DbAdminGetInfoQuery['info'];
export type DBAdminSessionList = DbAdminListSessionsQuery['list'];
export type DBAdminLockList = DbAdminListLocksQuery['list'];
export type DBAdminLockDetails = DbAdminGetLockDetailsQuery['details'];

function toParams(connection: IConnectionInfoParams): IConnectionInfoParams {
  return { projectId: connection.projectId, connectionId: connection.connectionId };
}

function getConnectionKey(connection: IConnectionInfoParams): string {
  return `${connection.projectId}:${connection.connectionId}`;
}

@injectable(() => [GraphQLService])
export class DBAdminService {
  /** Supported features per connection. Missing key: not requested yet. Null: request failed. */
  private readonly infoCache: Map<string, DBAdminInfo | null>;
  private readonly pendingInfo: Set<string>;

  constructor(private readonly graphQLService: GraphQLService) {
    this.infoCache = new Map();
    this.pendingInfo = new Set();

    makeObservable<this, 'infoCache'>(this, {
      infoCache: observable.shallow,
    });
  }

  /**
   * Returns cached supported features of a connection and requests them once if they are unknown.
   * Safe to call during rendering: the request starts outside the current reaction.
   */
  getInfo(connection: IConnectionInfoParams): DBAdminInfo | null | undefined {
    const key = getConnectionKey(connection);

    if (!this.infoCache.has(key) && !this.pendingInfo.has(key)) {
      const params = toParams(connection);
      queueMicrotask(() => this.requestInfo(params));
    }

    return this.infoCache.get(key);
  }

  async listSessions(connection: IConnectionInfoParams, showIdle: boolean): Promise<DBAdminSessionList> {
    const { list } = await this.graphQLService.sdk.dbAdminListSessions({ ...toParams(connection), showIdle });
    return list;
  }

  async terminateSessions(connection: IConnectionInfoParams, sessionIds: string[], cancelQueryOnly: boolean): Promise<void> {
    await this.graphQLService.sdk.dbAdminTerminateSessions({ ...toParams(connection), sessionIds, cancelQueryOnly });
  }

  async listLocks(connection: IConnectionInfoParams): Promise<DBAdminLockList> {
    const { list } = await this.graphQLService.sdk.dbAdminListLocks(toParams(connection));
    return list;
  }

  async getLockDetails(connection: IConnectionInfoParams, lockId: string): Promise<DBAdminLockDetails> {
    const { details } = await this.graphQLService.sdk.dbAdminGetLockDetails({ ...toParams(connection), lockId });
    return details;
  }

  async terminateLock(connection: IConnectionInfoParams, lockId: string): Promise<void> {
    await this.graphQLService.sdk.dbAdminTerminateLock({ ...toParams(connection), lockId });
  }

  private async requestInfo(connection: IConnectionInfoParams): Promise<void> {
    const key = getConnectionKey(connection);

    if (this.infoCache.has(key) || this.pendingInfo.has(key)) {
      return;
    }

    this.pendingInfo.add(key);

    try {
      const { info } = await this.graphQLService.sdk.dbAdminGetInfo(toParams(connection));
      this.infoCache.set(key, info);
    } catch {
      this.infoCache.set(key, null);
    } finally {
      this.pendingInfo.delete(key);
    }
  }
}
