/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, SqlDialectInfo } from '@cloudbeaver/core-sdk';

@injectable()
export class SqlDialectInfoService {
  private dialectInfo = new Map<string, SqlDialectInfo>();

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService
  ) {
    makeObservable<SqlDialectInfoService, 'dialectInfo'>(this, {
      dialectInfo: observable,
    });
  }

  async formatScript(context: IConnectionExecutionContextInfo, query: string): Promise<string> {
    try {
      const result = await this.graphQLService.sdk.formatSqlQuery({
        connectionId: context.connectionId,
        contextId: context.id,
        query,
      });

      return result.query;
    } catch (error) {
      this.notificationService.logException(error, 'Failed to format script');
    }
    return query;
  }

  getDialectInfo(connectionId: string): SqlDialectInfo | undefined {
    return this.dialectInfo.get(connectionId);
  }

  async loadSqlDialectInfo(connectionId: string): Promise<SqlDialectInfo | undefined> {
    if (!this.dialectInfo.has(connectionId)) {
      try {
        const result = await this.graphQLService.sdk.querySqlDialectInfo({ connectionId });
        this.dialectInfo.set(connectionId, result.dialect!);
      } catch (error) {
        this.notificationService.logException(error, 'Failed to load SqlDialectInfo');
      }
    }

    return this.getDialectInfo(connectionId);
  }
}
