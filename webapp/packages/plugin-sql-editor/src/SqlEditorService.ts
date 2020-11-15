/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, QuerySqlCompletionProposalsQuery } from '@cloudbeaver/core-sdk';
import { IExecutionContext } from '@cloudbeaver/plugin-data-viewer';

import { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDialectInfoService } from './SqlDialectInfoService';

@injectable()
export class SqlEditorService {
  constructor(
    private gql: GraphQLService,
    private connectionInfoResource: ConnectionInfoResource,
    private sqlDialectInfoService: SqlDialectInfoService,
    private connectionsManagerService: ConnectionsManagerService,
    private notificationService: NotificationService,
  ) {
  }

  async getAutocomplete(
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number
  ): Promise<QuerySqlCompletionProposalsQuery['sqlCompletionProposals'] | null> {
    const result = await this.gql.sdk.querySqlCompletionProposals({
      connectionId,
      contextId,
      query,
      position: cursor,
    });

    return result.sqlCompletionProposals;
  }

  async initEditorConnection(state: ISqlEditorTabState): Promise<IExecutionContext | undefined> {
    if (!state.connectionId) {
      console.error('executeEditorQuery connectionId is not provided');
      return;
    }

    const context = await this.initContext(state.connectionId, state.objectCatalogId, state.objectSchemaId);

    if (!context) {
      return;
    }

    return context;
  }

  async initContext(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<IExecutionContext | null> {
    const connection = await this.connectionsManagerService.requireConnection(connectionId);
    if (!connection) {
      return null;
    }

    try {
      await this.sqlDialectInfoService.loadSqlDialectInfo(connection.id);

      return await this.createSqlContext(connection.id, catalogId, schemaId);
    } catch (exception) {
      this.notificationService.logException(
        exception,
        `Failed to create context for ${connection.name} connection`,
      );
      return null;
    }
  }

  async destroySqlContext(connectionId?: string, contextId?: string): Promise<void> {
    if (!connectionId) {
      return;
    }

    const connection = this.connectionInfoResource.get(connectionId);
    if (!connection?.connected || !contextId) {
      return;
    }
    try {
      await this.gql.sdk.sqlContextDestroy({ connectionId, contextId });
    } catch (exception) {
      this.notificationService.logException(exception, `Failed to destroy SQL-context ${contextId}`, '', true);
    }
  }

  /**
   * Returns context id, context catalog and schema
   * When try create context without catalog or schema the context is created with default catalog and schema
   * and response contains its ids.
   * If in the response there are no catalog or schema it means that database has no catalogs or schemas at all.
   */
  async createSqlContext(
    connectionId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<IExecutionContext> {
    const response = await this.gql.sdk.sqlContextCreate({
      connectionId,
      defaultCatalog,
      defaultSchema,
    });
    return {
      contextId: response.context.id,
      connectionId,
      objectCatalogId: response.context.defaultCatalog,
      objectSchemaId: response.context.defaultSchema,
    };
  }

  /**
   * Update catalog and schema for the exiting sql context in the certain connection
   */
  async updateSqlContext(
    connectionId: string,
    contextId?: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<void> {
    if (!contextId) {
      throw new Error('updateSqlContext contextId not provided');
    }
    await this.gql.sdk.sqlContextSetDefaults({
      connectionId,
      contextId,
      defaultCatalog,
      defaultSchema,
    });
  }
}
