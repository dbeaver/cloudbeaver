/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavigationTabsService,
  ITab,
  ConnectionsManagerService,
  ConnectionInfoResource,
  INavigator,
  NavigationService,
  IContextProvider,
  ITabOptions,
  ConnectionAuthService,
} from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { IExecutionContext } from '@cloudbeaver/plugin-data-viewer';

import { ISqlEditorTabState } from './ISqlEditorTabState';
import { SqlDialectInfoService } from './SqlDialectInfoService';
import { sqlEditorTabHandlerKey } from './sqlEditorTabHandlerKey';
import { SqlExecutionState } from './SqlExecutionState';

enum SQLEditorNavigationAction {
  create,
  select,
  close
}

export interface SQLEditorActionContext {
  type: SQLEditorNavigationAction;
}

export interface SQLCreateAction extends SQLEditorActionContext {
  type: SQLEditorNavigationAction.create;

  connectionId?: string;
  catalogId?: string;
  schemaId?: string;
}

export interface SQLEditorAction extends SQLEditorActionContext {
  type: SQLEditorNavigationAction.close | SQLEditorNavigationAction.select;

  editorId: string;
  resultId: string;
}

@injectable()
export class SqlEditorNavigatorService {

  private readonly navigator: INavigator<SQLCreateAction | SQLEditorAction>;
  constructor(
    private navigationTabsService: NavigationTabsService,
    private connectionsManagerService: ConnectionsManagerService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private gql: GraphQLService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private navigationService: NavigationService,
    private connectionAuthService: ConnectionAuthService
  ) {

    this.navigator = this.navigationService.createNavigator<SQLCreateAction | SQLEditorAction>(
      null,
      this.navigateHandler.bind(this)
    );
    this.connectionsManagerService.onCloseConnection.subscribe(this.nodeNavigationHandler.bind(this));
  }

  registerTabHandler() {
  }

  openNewEditor(connectionId?: string, catalogId?: string, schemaId?: string) {
    this.navigator.navigateTo({
      type: SQLEditorNavigationAction.create,
      connectionId,
      catalogId,
      schemaId,
    });
  }

  openEditorResult(editorId: string, resultId: string) {
    this.navigator.navigateTo({
      type: SQLEditorNavigationAction.select,
      editorId,
      resultId,
    });
  }

  closeEditorResult(editorId: string, resultId: string) {
    this.navigator.navigateTo({
      type: SQLEditorNavigationAction.close,
      editorId,
      resultId,
    });
  }

  private async nodeNavigationHandler(connectionId: string) {
    try {
      for (const tab of this.navigationTabsService.findTabs(
        isSQLEditorTab(tab => tab.handlerState.connectionId.includes(connectionId))
      )) {
        await this.navigationTabsService.closeTab(tab.id);
      }
      return;
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in Object Viewer while processing action with database node');
    }
  }

  private async navigateHandler(
    contexts: IContextProvider<SQLCreateAction | SQLEditorAction>,
    data: SQLCreateAction | SQLEditorAction
  ) {
    try {
      const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);

      if (data.type === SQLEditorNavigationAction.create) {
        const tabOptions = await this.createNewEditor(data.connectionId, data.catalogId, data.schemaId);
        if (tabOptions) {
          tabInfo.openNewTab(tabOptions);
        } else {
          this.notificationService.logError({
            title: `Failed to create editor for ${data.connectionId} connection`,
          });
        }
        return;
      }

      const tab = this.navigationTabsService.findTab(isSQLEditorTab(tab => tab.id === data.editorId));
      if (!tab) {
        return;
      }

      if (data.type === SQLEditorNavigationAction.select) {
        tab.handlerState.currentResultTabId = data.resultId;
      } else if (data.type === SQLEditorNavigationAction.close) {
        tab.handlerState.resultTabs.splice(
          tab.handlerState.resultTabs.findIndex(result => result.resultTabId === data.resultId),
          1
        );

        if (tab.handlerState.currentResultTabId === data.resultId) {
          tab.handlerState.currentResultTabId = tab.handlerState.resultTabs[0]?.resultTabId || '';
        }
      }
      this.navigationTabsService.selectTab(tab.id);
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in SQL Editor while processing action with editor');
    }
  }

  private async createNewEditor(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<ITabOptions<ISqlEditorTabState> | null> {
    const order = this.getFreeEditorId();

    if (!connectionId) {
      connectionId = Array.from(this.connectionInfoResource.data.values())[0].id;
    }

    const connection = await this.connectionAuthService.auth(connectionId);

    if (!connection?.connected) {
      return null;
    }

    await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);

    const context = await this.createSqlContext(connectionId, catalogId, schemaId);

    return {
      handlerId: sqlEditorTabHandlerKey,
      handlerState: {
        query: '',
        order,
        contextId: context.contextId,
        connectionId,
        objectCatalogId: context.objectCatalogId,
        objectSchemaId: context.objectSchemaId,
        sqlExecutionState: new SqlExecutionState(),
        resultTabs: [],
      },
    };
  }

  private getFreeEditorId() {
    const editorTabs = this.navigationTabsService.findTabs(isSQLEditorTab);
    const ordered = Array.from(editorTabs).map(tab => tab.handlerState.order);
    return findMinimalFree(ordered, 1);
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

    const response = await this.gql.gql.sqlContextCreate({
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
