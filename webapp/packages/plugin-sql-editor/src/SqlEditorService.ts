/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionExecutionContextService, ConnectionsManagerService, IConnectionExecutionContext, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, QuerySqlCompletionProposalsQuery, SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';
import type { ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

@injectable()
export class SqlEditorService {
  constructor(
    private readonly gql: GraphQLService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService
  ) {
  }

  getState(order: number, contextInfo: IConnectionExecutionContextInfo): ISqlEditorTabState {
    return {

      query: '',
      order,
      executionContext: { ...contextInfo },
      tabs: [],
      resultGroups: [],
      resultTabs: [],
      executionPlanTabs: [],
      statisticsTabs: [],
    };
  }

  async parseSQLScript(
    connectionId: string,
    script: string
  ): Promise<SqlScriptInfoFragment> {
    const result = await this.gql.sdk.parseSQLScript({
      connectionId,
      script,
    });

    return result.scriptInfo;
  }

  async getAutocomplete(
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number,
    maxResults?: number,
    simple?: boolean,
  ): Promise<QuerySqlCompletionProposalsQuery> {
    const result = await this.gql.sdk.querySqlCompletionProposals({
      connectionId,
      contextId,
      query,
      position: cursor,
      maxResults,
      simple,
    });

    return result;
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
