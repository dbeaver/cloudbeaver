/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ConnectionExecutionContextResource, ConnectionExecutionContextService, ConnectionInfoResource, ConnectionsManagerService, IConnectionExecutionContext, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor } from '@cloudbeaver/core-executor';
import { GraphQLService, SqlCompletionProposal, SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';
import { SqlDataSourceService, ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

import { getSqlEditorName } from './getSqlEditorName';
import { ESqlDataSourceFeatures } from './SqlDataSource/ESqlDataSourceFeatures';

export type SQLProposal = SqlCompletionProposal;

export interface IQueryChangeData {
  prevQuery: string;
  query: string;
  state: ISqlEditorTabState;
}

@injectable()
export class SqlEditorService {
  readonly onQueryChange: Executor<IQueryChangeData>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlDataSourceService: SqlDataSourceService
  ) {
    this.onQueryChange = new Executor();
  }

  getState(
    editorId: string,
    datasourceKey: string,
    order: number,
    source?: string,
  ): ISqlEditorTabState {
    return observable({
      editorId,
      datasourceKey,
      source,
      order,
      tabs: [],
      resultGroups: [],
      resultTabs: [],
      executionPlanTabs: [],
      statisticsTabs: [],
      currentModeId: undefined,
      modeState: [],
    });
  }

  async parseSQLScript(
    connectionId: string,
    script: string
  ): Promise<SqlScriptInfoFragment> {
    const result = await this.graphQLService.sdk.parseSQLScript({
      connectionId,
      script,
    });

    return result.scriptInfo;
  }

  async parseSQLQuery(
    connectionId: string,
    script: string,
    position: number,
  ) {
    const result = await this.graphQLService.sdk.parseSQLQuery({
      connectionId,
      script,
      position,
    });

    return result.queryInfo;
  }

  async getAutocomplete(
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number,
    maxResults?: number,
    simple?: boolean,
  ): Promise<SQLProposal[]> {
    const { proposals } = await this.graphQLService.sdk.querySqlCompletionProposals({
      connectionId,
      contextId,
      query,
      position: cursor,
      maxResults,
      simple,
    });

    return proposals as SQLProposal[];
  }

  getName(tabState: ISqlEditorTabState): string {
    const dataSource = this.sqlDataSourceService.get(tabState.editorId);
    const connection = this.connectionInfoResource.get(dataSource?.executionContext?.connectionId || '');

    return getSqlEditorName(tabState, dataSource, connection);
  }

  setName(name: string, state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (dataSource && dataSource.features.includes(ESqlDataSourceFeatures.setName)) {
      dataSource.setName(name);
    }
  }

  setQuery(query: string, state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (dataSource) {
      const prevQuery = dataSource.script;

      dataSource.setScript(query);
      this.onQueryChange.execute({ prevQuery, query, state });
    }
  }

  async resetExecutionContext(state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (dataSource?.executionContext) {
      await this.destroyContext(dataSource.executionContext);

      dataSource.setExecutionContext(undefined);
    }
  }

  async setConnection(
    state: ISqlEditorTabState,
    connectionId: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<boolean> {
    try {
      const executionContext = await this.initContext(connectionId, catalogId, schemaId);
      const dataSource = this.sqlDataSourceService.get(state.editorId);

      if (!executionContext?.context || !dataSource) {
        return false;
      }

      const previousContext = dataSource.executionContext;
      dataSource.setExecutionContext({ ...executionContext.context });

      if (previousContext) {
        await this.destroyContext(previousContext);
      }

      return true;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor connection');
      return false;
    }
  }

  async initEditorConnection(state: ISqlEditorTabState): Promise<IConnectionExecutionContext | undefined> {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (!dataSource?.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const context = await this.initContext(
      dataSource.executionContext.connectionId,
      dataSource.executionContext.defaultCatalog,
      dataSource.executionContext.defaultSchema
    );

    if (!context?.context) {
      await this.resetExecutionContext(state);
      return;
    }

    dataSource.setExecutionContext({ ...context.context });

    return context;
  }

  async canDestroy(state: ISqlEditorTabState): Promise<boolean> {
    return await this.sqlDataSourceService.canDestroy(state.editorId);
  }

  async destroy(state: ISqlEditorTabState): Promise<void> {
    await this.sqlDataSourceService.destroy(state.editorId);
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
    } catch (exception: any) {
      this.notificationService.logException(
        exception,
        `Failed to create context for ${connection.name} connection`,
      );
      return null;
    }
  }

  async destroyContext(contextInfo: IConnectionExecutionContextInfo) {
    await this.connectionExecutionContextResource.loadAll();

    const executionContext = this.connectionExecutionContextService.get(contextInfo.id);

    if (executionContext) {
      try {
        await executionContext.destroy();
      } catch (exception: any) {
        this.notificationService.logException(exception, `Failed to destroy SQL-context ${executionContext.context?.id}`, '', true);
      }
    }
  }
}
