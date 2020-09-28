/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavigationTabsService } from '@cloudbeaver/core-app';
import { ConnectionsManagerService, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutor, Executor, IContextProvider } from '@cloudbeaver/core-executor';

import { SqlEditorTabService, isSQLEditorTab } from './SqlEditorTabService';
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
  private readonly navigator: IExecutor<SQLCreateAction | SQLEditorAction>;

  constructor(
    private navigationTabsService: NavigationTabsService,
    private connectionsManagerService: ConnectionsManagerService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private sqlEditorTabService: SqlEditorTabService
  ) {

    this.navigator = new Executor<SQLCreateAction | SQLEditorAction>()
      .addHandler(this.navigateHandler.bind(this));
    this.connectionsManagerService.onCloseConnection.subscribe(this.handleConnectionClose.bind(this));
  }

  registerTabHandler() { }

  openNewEditor(connectionId?: string, catalogId?: string, schemaId?: string) {
    this.navigator.execute({
      type: SQLEditorNavigationAction.create,
      connectionId,
      catalogId,
      schemaId,
    });
  }

  openEditorResult(editorId: string, resultId: string) {
    this.navigator.execute({
      type: SQLEditorNavigationAction.select,
      editorId,
      resultId,
    });
  }

  closeEditorResult(editorId: string, resultId: string) {
    this.navigator.execute({
      type: SQLEditorNavigationAction.close,
      editorId,
      resultId,
    });
  }

  private async handleConnectionClose(connectionId: string) {
    try {
      for (const tab of this.navigationTabsService.findTabs(
        isSQLEditorTab(tab => tab.handlerState.connectionId.includes(connectionId))
      )) {
        await this.navigationTabsService.closeTab(tab.id);
      }
      return;
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in SQL Editor while processing connection close');
    }
  }

  private async navigateHandler(
    contexts: IContextProvider<SQLCreateAction | SQLEditorAction>,
    data: SQLCreateAction | SQLEditorAction
  ) {
    try {
      const tabInfo = await contexts.getContext(this.navigationTabsService.navigationTabContext);

      if (data.type === SQLEditorNavigationAction.create) {
        const tabOptions = await this.sqlEditorTabService.createNewEditor(
          data.connectionId,
          data.catalogId,
          data.schemaId
        );
        const connectionInfo = this.connectionInfoResource.get(data.connectionId || '');

        if (tabOptions) {
          const tab = tabInfo.openNewTab(tabOptions);

          // FIXME: should be in SqlEditorTabService
          this.sqlEditorTabService.tabExecutionState.set(tab.id, new SqlExecutionState());
        } else {
          this.notificationService.logError({
            title: `Failed to create editor for ${connectionInfo?.name || data.connectionId} connection`,
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
          if (tab.handlerState.resultTabs.length > 0) {
            tab.handlerState.currentResultTabId = tab.handlerState.resultTabs[0].resultTabId;
          } else {
            tab.handlerState.currentResultTabId = '';
          }
        }
      }
      this.navigationTabsService.selectTab(tab.id);
    } catch (exception) {
      this.notificationService.logException(exception, 'Error in SQL Editor while processing action with editor');
    }
  }
}
