/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionExecutionContextService, ConnectionsManagerService, IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, QuerySqlCompletionProposalsQuery } from '@cloudbeaver/core-sdk';

import type { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDialectInfoService } from './SqlDialectInfoService';

@injectable()
export class SqlEditorService {
  constructor(
    private gql: GraphQLService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private connectionsManagerService: ConnectionsManagerService,
    private notificationService: NotificationService,
    private connectionExecutionContextService: ConnectionExecutionContextService
  ) {
  }

  async getAutocomplete(
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number,
    maxResults?: number,
    simple?: boolean,
  ): Promise<QuerySqlCompletionProposalsQuery['sqlCompletionProposals'] | null> {
    const result = await this.gql.sdk.querySqlCompletionProposals({
      connectionId,
      contextId,
      query,
      position: cursor,
      maxResults,
      simple,
    });

    return result.sqlCompletionProposals;
  }

  async initEditorConnection(state: ISqlEditorTabState): Promise<IConnectionExecutionContext | undefined> {
    if (!state.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const context = await this.initContext(
      state.executionContext.connectionId,
      state.executionContext.defaultCatalog,
      state.executionContext.defaultSchema
    );

    if (!context) {
      return;
    }

    return context;
  }

  async initContext(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<IConnectionExecutionContext | null> {
    const connection = await this.connectionsManagerService.requireConnection(connectionId);
    if (!connection) {
      return null;
    }

    try {
      await this.sqlDialectInfoService.loadSqlDialectInfo(connection.id);

      return await this.connectionExecutionContextService.create(connection.id, catalogId, schemaId);
    } catch (exception) {
      this.notificationService.logException(
        exception,
        `Failed to create context for ${connection.name} connection`,
      );
      return null;
    }
  }
}
