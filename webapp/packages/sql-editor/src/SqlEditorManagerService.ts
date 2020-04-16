/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ConnectionsManagerService,
  IConnectionCatalogSchema,
  IContextProvider,
  INavigator,
  NavigationService,
  NavigationTabsService,
  Tab,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GraphQLService } from '@dbeaver/core/sdk';
import { uuid } from '@dbeaver/core/utils';

import { ISqlContextParams, ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDialectInfoService } from './SqlDialectInfoService';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';
import { SqlExecutionState } from './SqlExecutionState';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';


export interface SqlEditorAction {
  createNew?: {
    connectionId?: string;
    catalogId?: string;
    schemaId?: string;
  };
  open?: {
    editorId: string;
    resultId: string;
  };
  close?: {
    editorId: string;
    resultId: string;
  };
}

export const SQL_EDITOR_URL_PATTERN = /^plugin:\/\/sql-editor\//;

@injectable()
export class SqlEditorManagerService {

  private readonly navigator!: INavigator<SqlEditorAction>;

  constructor(private sqlResultTabsService: SqlResultTabsService,
              private navigationTabsService: NavigationTabsService,
              private notificationService: NotificationService,
              private gql: GraphQLService,
              private connectionsManagerService: ConnectionsManagerService,
              private sqlDialectInfoService: SqlDialectInfoService,
              private navigationService: NavigationService) {

    this.navigator = this.navigationService.createNavigator<SqlEditorAction>(
      null,
      this.navigateHandler.bind(this)
    );
  }

  openNewEditor(connectionId?: string) {
    this.navigator.navigateTo({
      createNew: {
        connectionId,
      },
    });
  }

  openEditorResult(editorId: string, resultId: string) {
    this.navigator.navigateTo({ open: { editorId, resultId } });
  }

  closeEditorResult(editorId: string, resultId: string) {
    this.navigator.navigateTo({ close: { editorId, resultId } });
  }

  isSqlEditorEntity = (id: string) => SQL_EDITOR_URL_PATTERN.test(id)

  getUrlFromId(id: string) {
    return `plugin://sql-editor/${id}`;
  }

  private async navigateHandler(contexts: IContextProvider<SqlEditorAction>, data: SqlEditorAction) {
    try {
      if (data.createNew) {
        await this.createNewEditor(data.createNew.connectionId);
        return;
      }

      if (data.open) {
        const state = this.getHandlerState(data.open.editorId);
        if (!state) {
          return;
        }
        state.currentResultTabId = data.open.resultId;
        this.navigationTabsService.selectTab(data.open.editorId);
        return;
      }

      if (data.close) {
        const state = this.getHandlerState(data.close.editorId);
        if (!state) {
          return;
        }
        state.resultTabs.splice(state.resultTabs.findIndex(result => result.resultTabId === data.close!.resultId), 1);

        if (state.currentResultTabId === data.close.resultId) {
          state.currentResultTabId = state.resultTabs[0]?.resultTabId || '';
        }
        this.navigationTabsService.selectTab(data.close.editorId);
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in SQL Editor while processing action with editor');
    }
  }

  async executeEditorQuery(editorId: string, query: string, inNewTab = false) {
    const state = this.getHandlerState(editorId);
    if (!state) {
      return;
    }
    await this.sqlResultTabsService.executeEditorQuery(state, query, inNewTab);
  }

  async handleTabRestore(tabId: string, handlerId: string): Promise<boolean> {
    const match = /^plugin:\/\/sql-editor\/(.*?)(\/|$)/.exec(tabId);
    if (match && match.length > 0) {
      const state = this.getHandlerState(tabId);

      if (!state
        || typeof state.query !== 'string'
        || typeof state.connectionId !== 'string'
        || typeof state.order !== 'number'
        || typeof state.contextId !== 'string'
        || !['string', 'undefined'].includes(typeof state.currentResultTabId)
        || !Array.isArray(state.resultTabs)
      ) {
        return false;
      }

      // the connection for this editor was closed
      if (!this.connectionsManagerService.getConnectionById(state?.connectionId)) {
        return false;
      }

      state.currentResultTabId = '';
      state.resultTabs = []; // clean old results
      state.sqlExecutionState = new SqlExecutionState();
      state.changeSchema = connectionCatalogSchema => this.changeConnectionAndSchema(tabId, connectionCatalogSchema);

      await this.sqlDialectInfoService.loadSqlDialectInfo(state.connectionId);
    }
    return true;
  }

  async handleTabClose(tabId: string, handlerId: string) {
    if (!this.isSqlEditorEntity(tabId)) {
      return;
    }

    const state = this.getHandlerState(tabId);
    if (!state) {
      return;
    }

    await this.destroySqlContext(state.connectionId, state.contextId);
  }

  private async destroySqlContext(connectionId: string, contextId: string): Promise<void> {
    const connection = this.connectionsManagerService.getConnectionById(connectionId);
    if (!connection) {
      // connection was closed before, nothing to destroy
      return;
    }
    try {
      await this.gql.gql.sqlContextDestroy({ connectionId, contextId });
    } catch (e) {
      this.notificationService.logError({ title: `Failed to destroy SQL-context ${contextId}` });
    }
  }

  /**
   * Returns context id, context catalog and schema
   * When try create context without catalog or schema the context is created with default catalog and schema
   * and response contains its ids.
   * If in the response there are no catalog or schema it means that database has no catalogs or schemas at all.
   */
  private async createSqlContext(connectionCatalogSchema: IConnectionCatalogSchema): Promise<ISqlContextParams> {

    const response = await this.gql.gql.sqlContextCreate(connectionCatalogSchema);
    return {
      contextId: response.context.id,
      connectionId: connectionCatalogSchema.connectionId,
      catalogId: response.context.defaultCatalog || null,
      schemaId: response.context.defaultSchema || null,
    };
  }

  /**
   * Update catalog and schema for the exiting sql context in the certain connection
   */
  private async updateSqlContext(params: ISqlContextParams): Promise<ISqlContextParams> {
    await this.gql.gql.sqlContextSetDefaults({
      contextId: params.contextId,
      connectionId: params.connectionId,
      defaultCatalog: params.catalogId || undefined,
      defaultSchema: params.schemaId || undefined,
    });
    return params;
  }

  getHandlerState(editorId: string): ISqlEditorTabState | undefined {
    return this.navigationTabsService.getHandlerState<ISqlEditorTabState>(editorId, sqlEditorTabHandlerKey);
  }

  private async createNewEditor(connectionId?: string) {
    const order = this.getFreeEditorId();

    const connection = connectionId
      ? this.connectionsManagerService.getConnectionById(connectionId)
      : this.connectionsManagerService.connections[0];

    if (!connection) {
      return;
    }

    const sqlContextParams = await this.createSqlContext({
      connectionId: connection.id,
      catalogId: null,
      schemaId: null,
    });
    const tabId = this.getUrlFromId(uuid());
    const state: ISqlEditorTabState = {
      query: '',
      order,
      contextId: sqlContextParams.contextId,
      connectionId: connection.id,
      schemaId: sqlContextParams.schemaId,
      catalogId: sqlContextParams.catalogId,
      changeSchema: connectionCatalogSchema => this.changeConnectionAndSchema(tabId, connectionCatalogSchema),
      sqlExecutionState: new SqlExecutionState(),
      resultTabs: [],
    };

    const newTab = new Tab({
      nodeId: tabId,
      handlerId: sqlEditorTabHandlerKey,
      handlerState: new Map([[
        sqlEditorTabHandlerKey,
        {
          handlerId: sqlEditorTabHandlerKey,
          state,
        },
      ]]),
      name: this.generateTabName(state), // todo after refactoring it should be computable
      icon: '/icons/sql_script.png',
    });
    newTab.name = this.generateTabName(state);

    this.navigationTabsService.openTab(newTab, true);
    this.navigationTabsService.selectTab(newTab.nodeId);
    await this.sqlDialectInfoService.loadSqlDialectInfo(connection.id);
  }

  private getFreeEditorId() {
    const openedEditors = this.navigationTabsService.tabIdList.filter(this.isSqlEditorEntity);
    const ordered = openedEditors.map(tabId => this.getHandlerState(tabId)!.order);
    return findMinimalFree(ordered, 1);
  }

  private async changeConnectionAndSchema(
    tabId: string,
    connectionCatalogSchema: IConnectionCatalogSchema
  ): Promise<IConnectionCatalogSchema> {

    const state = this.getHandlerState(tabId)!;

    const contextParams: ISqlContextParams = {
      contextId: state.contextId,
      ...connectionCatalogSchema,
    };

    try {
      const newContextParams = connectionCatalogSchema.connectionId === state.connectionId
        ? await this.updateSqlContext(contextParams)
        : await this.changeConnection(contextParams, state.connectionId);

      state.connectionId = newContextParams.connectionId;
      state.schemaId = newContextParams.schemaId;
      state.catalogId = newContextParams.catalogId;
      state.contextId = newContextParams.contextId;

      const tab = this.navigationTabsService.getTab(tabId)!;
      tab.name = this.generateTabName(state);
      await this.sqlDialectInfoService.loadSqlDialectInfo(newContextParams.connectionId);

      return newContextParams;
    } catch (e) {
      this.notificationService.logError({ title: 'Failed to change SQL-editor schema' });
      return connectionCatalogSchema;
    }

  }

  private async changeConnection(params: ISqlContextParams, oldConnectionId: string): Promise<ISqlContextParams> {
    // try to create new context first
    const newContextParams = await this.createSqlContext(params);
    // when new context created - destroy old one silently
    await this.destroySqlContext(oldConnectionId, params.contextId);
    return newContextParams;
  }

  private generateTabName(state: ISqlEditorTabState): string {
    const connection = this.connectionsManagerService.getConnectionById(state.connectionId);

    return `sql-${state.order} (${connection?.name || ''})`;
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
