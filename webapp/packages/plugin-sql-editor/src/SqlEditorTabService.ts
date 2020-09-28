/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import {
  NavigationTabsService,
  TabHandler,
  ITab,
  objectSchemaProvider,
  objectCatalogProvider,
  objectCatalogSetter,
  objectSchemaSetter,
  ITabOptions,
} from '@cloudbeaver/core-app';
import {
  ConnectionInfoResource,
  connectionProvider,
  connectionSetter,
  ConnectionsManagerService
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { IExecutionContext } from '@cloudbeaver/plugin-data-viewer';

import { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDialectInfoService } from './SqlDialectInfoService';
import { SqlEditorPanel } from './SqlEditorPanel';
import { SqlEditorTab } from './SqlEditorTab';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';
import { SqlExecutionState } from './SqlExecutionState';

@injectable()
export class SqlEditorTabService {
  @observable readonly tabExecutionState: Map<string, SqlExecutionState>;
  readonly tabHandler: TabHandler<ISqlEditorTabState>;

  constructor(
    private navigationTabsService: NavigationTabsService,
    private connectionInfoResource: ConnectionInfoResource,
    private notificationService: NotificationService,
    private gql: GraphQLService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private connectionsManagerService: ConnectionsManagerService
  ) {
    this.tabExecutionState = new Map();

    this.tabHandler = this.navigationTabsService
      .registerTabHandler<ISqlEditorTabState>({
        key: sqlEditorTabHandlerKey,
        getTabComponent: () => SqlEditorTab,
        getPanelComponent: () => SqlEditorPanel,
        onRestore: this.handleTabRestore.bind(this),
        onClose: this.handleTabClose.bind(this),
        extensions: [
          connectionProvider(this.getConnectionId.bind(this)),
          objectCatalogProvider(this.getObjectCatalogId.bind(this)),
          objectSchemaProvider(this.getObjectSchemaId.bind(this)),
          connectionSetter(this.setConnectionId.bind(this)),
          objectCatalogSetter(this.setObjectCatalogId.bind(this)),
          objectSchemaSetter(this.setObjectSchemaId.bind(this)),
        ],
      });
  }

  registerTabHandler() { }

  async createNewEditor(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<ITabOptions<ISqlEditorTabState> | null> {
    const order = this.getFreeEditorId();
    const connection = await this.connectionsManagerService.requireConnection(connectionId);
    if (!connection) {
      return null;
    }

    await this.sqlDialectInfoService.loadSqlDialectInfo(connection.id);

    const context = await this.createSqlContext(connection.id, catalogId, schemaId);

    return {
      handlerId: sqlEditorTabHandlerKey,
      handlerState: {
        query: '',
        order,
        contextId: context.contextId,
        connectionId: connection.id,
        objectCatalogId: context.objectCatalogId,
        objectSchemaId: context.objectSchemaId,
        queryTabGroups: [],
        resultTabs: [],
      },
    };
  }

  private getFreeEditorId() {
    const editorTabs = this.navigationTabsService.findTabs(isSQLEditorTab);
    const ordered = Array.from(editorTabs).map(tab => tab.handlerState.order);
    return findMinimalFree(ordered, 1);
  }

  private async handleTabRestore(tab: ITab<ISqlEditorTabState>): Promise<boolean> {

    if (typeof tab.handlerState.query !== 'string'
        || typeof tab.handlerState.connectionId !== 'string'
        || typeof tab.handlerState.contextId !== 'string'
        || typeof tab.handlerState.objectCatalogId !== 'string'
        || typeof tab.handlerState.order !== 'number'
        || !['string', 'undefined'].includes(typeof tab.handlerState.currentResultTabId)
        || !Array.isArray(tab.handlerState.queryTabGroups)
        || !Array.isArray(tab.handlerState.resultTabs)
    ) {
      return false;
    }

    // the connection for this editor was closed
    if (!this.connectionInfoResource.get(tab.handlerState.connectionId)) {
      return false;
    }

    tab.handlerState.currentResultTabId = '';
    tab.handlerState.queryTabGroups = []; // clean old results
    tab.handlerState.resultTabs = []; // clean old results

    this.tabExecutionState.set(tab.id, new SqlExecutionState());

    await this.sqlDialectInfoService.loadSqlDialectInfo(tab.handlerState.connectionId);

    return true;
  }

  private getConnectionId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.connectionId;
  }

  private getObjectCatalogId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.objectCatalogId;
  }

  private getObjectSchemaId(tab: ITab<ISqlEditorTabState>) {
    return tab.handlerState.objectSchemaId;
  }

  private async setConnectionId(connectionId: string, tab: ITab<ISqlEditorTabState>) {
    try {
      const connection = await this.connectionsManagerService.requireConnection(connectionId);

      if (!connection) {
        return false;
      }
      // try to create new context first
      const context = await this.createSqlContext(connectionId);
      // when new context created - destroy old one silently
      await this.destroySqlContext(tab.handlerState.connectionId, tab.handlerState.contextId);

      tab.handlerState.connectionId = context.connectionId;
      tab.handlerState.contextId = context.contextId;
      tab.handlerState.objectCatalogId = context.objectCatalogId;
      tab.handlerState.objectSchemaId = context.objectSchemaId;
      await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor connection');
      return false;
    }
  }

  private async setObjectCatalogId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    try {
      await this.updateSqlContext(
        tab.handlerState.connectionId,
        tab.handlerState.contextId,
        containerId
      );
      tab.handlerState.objectCatalogId = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor catalog');
      return false;
    }
  }

  private async setObjectSchemaId(containerId: string, tab: ITab<ISqlEditorTabState>) {
    try {
      await this.updateSqlContext(
        tab.handlerState.connectionId,
        tab.handlerState.contextId,
        tab.handlerState.objectCatalogId,
        containerId
      );
      tab.handlerState.objectSchemaId = containerId;
      return true;
    } catch (exception) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor schema');
      return false;
    }
  }

  private async handleTabClose(tab: ITab<ISqlEditorTabState>) {
    this.tabExecutionState.delete(tab.id);
    await this.destroySqlContext(tab.handlerState.connectionId, tab.handlerState.contextId);
  }

  private async destroySqlContext(connectionId: string, contextId: string): Promise<void> {
    const connection = this.connectionInfoResource.get(connectionId);
    if (!connection) {
      // connection was closed before, nothing to destroy
      return;
    }
    try {
      await this.gql.sdk.sqlContextDestroy({ connectionId, contextId });
    } catch (exception) {
      this.notificationService.logException(exception, `Failed to destroy SQL-context ${contextId}`, true);
    }
  }

  /**
   * Returns context id, context catalog and schema
   * When try create context without catalog or schema the context is created with default catalog and schema
   * and response contains its ids.
   * If in the response there are no catalog or schema it means that database has no catalogs or schemas at all.
   */
  private async createSqlContext(
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
  private async updateSqlContext(
    connectionId: string,
    contextId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ) {
    await this.gql.sdk.sqlContextSetDefaults({
      connectionId,
      contextId,
      defaultCatalog,
      defaultSchema,
    });
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}

export function isSQLEditorTab(tab: ITab): tab is ITab<ISqlEditorTabState>;
export function isSQLEditorTab(
  predicate: (tab: ITab<ISqlEditorTabState>) => boolean
): (tab: ITab) => tab is ITab<ISqlEditorTabState>
export function isSQLEditorTab(
  tab: ITab | ((tab: ITab<ISqlEditorTabState>) => boolean)
): boolean | ((tab: ITab) => tab is ITab<ISqlEditorTabState>) {
  if (typeof tab === 'function') {
    const predicate = tab;
    return (tab: ITab): tab is ITab<ISqlEditorTabState> => {
      const sqlEditorTab = tab.handlerId === sqlEditorTabHandlerKey;
      if (!predicate || !sqlEditorTab) {
        return sqlEditorTab;
      }
      return predicate(tab);
    };
  }
  return tab.handlerId === sqlEditorTabHandlerKey;
}
