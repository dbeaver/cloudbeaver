/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GraphQLService, SqlDialectInfo } from '@dbeaver/core/sdk';

@injectable()
export class SqlDialectInfoService {

  @observable private dialectInfo = new Map<string, SqlDialectInfo>()

  constructor(private graphQLService: GraphQLService,
              private notificationService: NotificationService) {
  }


  getDialectInfo(connectionId: string): SqlDialectInfo | undefined {
    return this.dialectInfo.get(connectionId);
  }

  async loadSqlDialectInfo(connectionId: string): Promise<SqlDialectInfo | undefined> {
    if (!this.dialectInfo.has(connectionId)) {
      try {
        const result = await this.graphQLService.gql.querySqlDialectInfo({ connectionId });
        this.dialectInfo.set(connectionId, result.dialect);
      } catch (error) {
        this.notificationService.logException(error, 'Failed to load SqlDialectInfo');
      }
    }

    return this.getDialectInfo(connectionId);
  }
}
