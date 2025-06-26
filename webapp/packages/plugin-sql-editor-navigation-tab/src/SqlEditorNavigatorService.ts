/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource, createConnectionParam, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { NavigationService } from '@cloudbeaver/core-ui';
import { uuid } from '@cloudbeaver/core-utils';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import {
  type ISqlEditorTabState,
  MemorySqlDataSource,
  SqlDataSourceService,
  SqlQueryService,
  SqlResultTabsService,
} from '@cloudbeaver/plugin-sql-editor';

import { isSQLEditorTab } from './isSQLEditorTab.js';
import { SQL_EDITOR_SOURCE_ACTION } from './SQL_EDITOR_SOURCE_ACTION.js';
import { SqlEditorTabService } from './SqlEditorTabService.js';

enum SQLEditorNavigationAction {
  create,
  select,
  close,
}

export interface SQLEditorActionContext {
  type: SQLEditorNavigationAction;
}

export interface ISQLEditorOptions {
  dataSourceKey?: string;
  name?: string;
  connectionKey?: IConnectionInfoParams;
  catalogId?: string;
  schemaId?: string;
  source?: string;
  query?: string;
}

export interface SQLCreateAction extends SQLEditorActionContext, ISQLEditorOptions {
  type: SQLEditorNavigationAction.create;
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
    private readonly navigationTabsService: NavigationTabsService,
    private readonly notificationService: NotificationService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    navigationService: NavigationService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly sqlQueryService: SqlQueryService,
  ) {
    this.navigator = new Executor<SQLCreateAction | SQLEditorAction>(null, (active, current) => active.type === current.type)
      .before(navigationService.navigationTask)
      .addHandler(this.navigateHandler.bind(this));
  }

  async openNewEditor(options: ISQLEditorOptions) {
    return await this.navigator.execute({
      type: SQLEditorNavigationAction.create,
      ...options,
    });
  }

  async openEditorResult(editorId: string, resultId: string): Promise<void> {
    await this.navigator.execute({
      type: SQLEditorNavigationAction.select,
      editorId,
      resultId,
    });
  }

  async closeEditorResult(editorId: string, resultId: string): Promise<void> {
    await this.navigator.execute({
      type: SQLEditorNavigationAction.close,
      editorId,
      resultId,
    });
  }

  async executeEditorQuery(editorId: string, query: string, isNewTab = true): Promise<void> {
    const currentTab = this.navigationTabsService.findTab(isSQLEditorTab(tab => tab.id === editorId));

    if (!currentTab) {
      throw new Error(`SQL Editor tab with id "${editorId}" not found.`);
    }

    await this.sqlQueryService.executeEditorQuery(currentTab.handlerState, query, isNewTab);
  }

  private async navigateHandler(data: SQLCreateAction | SQLEditorAction, contexts: IExecutionContextProvider<SQLCreateAction | SQLEditorAction>) {
    try {
      const tabInfo = contexts.getContext(this.navigationTabsService.navigationTabContext);

      let tab: ITab<ISqlEditorTabState> | null = null;

      if (data.type === SQLEditorNavigationAction.create) {
        if (data.source === SQL_EDITOR_SOURCE_ACTION) {
          tab = this.navigationTabsService.findTab(
            isSQLEditorTab(tab => {
              const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);
              const executionContext = dataSource?.executionContext;

              return (
                tab.handlerState.source === SQL_EDITOR_SOURCE_ACTION &&
                executionContext !== undefined &&
                data.connectionKey !== undefined &&
                this.connectionInfoResource.isKeyEqual(
                  createConnectionParam(executionContext.projectId, executionContext.connectionId),
                  data.connectionKey,
                )
              );
            }),
          );
        }

        if (!tab) {
          const editorId = uuid();

          const tabOptions = this.sqlEditorTabService.createNewEditor(
            editorId,
            data.dataSourceKey ?? MemorySqlDataSource.key,
            data.name,
            data.source,
            data.query,
          );

          if (tabOptions) {
            tab = tabInfo.openNewTab(tabOptions);
          }

          if (tab && data.connectionKey) {
            await this.sqlEditorTabService.setConnectionId(tab, data.connectionKey, data.catalogId, data.schemaId);
          }
          return;
        }
      }

      if (!tab && 'editorId' in data) {
        tab = this.navigationTabsService.findTab(isSQLEditorTab(tab => tab.id === data.editorId));
      }

      if (!tab) {
        return;
      }

      if (data.type === SQLEditorNavigationAction.select) {
        this.sqlResultTabsService.selectResultTab(tab.handlerState, data.resultId);
      } else if (data.type === SQLEditorNavigationAction.close) {
        const canClose = await this.sqlResultTabsService.canCloseResultTab(tab.handlerState, data.resultId);

        if (canClose) {
          this.sqlResultTabsService.removeResultTab(tab.handlerState, data.resultId);
        }
      }

      this.navigationTabsService.selectTab(tab.id);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'SQL Editor Error', 'Error in SQL Editor while processing action with editor');
    }
  }
}
