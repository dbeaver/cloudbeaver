/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource, createConnectionParam, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { Executor, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { NavigationService } from '@cloudbeaver/core-ui';
import { uuid } from '@cloudbeaver/core-utils';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import {
  ESqlDataSourceFeatures,
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

export interface ISQLEditorActionContext {
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
  dataSourceState?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface ISQLCreateAction extends ISQLEditorActionContext, ISQLEditorOptions {
  type: SQLEditorNavigationAction.create;
}

export interface ISQLEditorAction extends ISQLEditorActionContext {
  type: SQLEditorNavigationAction.close | SQLEditorNavigationAction.select;

  editorId: string;
  resultId: string;
}

export class SqlEditorNavigatorServiceImpl {
  private readonly navigator: IExecutor<ISQLCreateAction | ISQLEditorAction>;

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
    this.navigator = new Executor<ISQLCreateAction | ISQLEditorAction>(null, (active, current) => active.type === current.type)
      .before(navigationService.navigationTask)
      .addHandler(this.navigateHandler.bind(this));
  }

  async openNewEditor(options: ISQLEditorOptions): Promise<IExecutionContextProvider<ISQLCreateAction | ISQLEditorAction>> {
    return await this.navigator.execute({
      type: SQLEditorNavigationAction.create,
      ...options,
    });
  }

  openRecentEditor(connectionKey?: IConnectionInfoParams): boolean {
    for (const tabId of this.navigationTabsService.history.history) {
      const tab = this.navigationTabsService.getTab(tabId);

      if (tab && isSQLEditorTab(tab)) {
        const dataSource = this.sqlDataSourceService.get(tab.handlerState.editorId);

        if (!dataSource?.hasFeature(ESqlDataSourceFeatures.script)) {
          continue;
        }

        const executionContext = dataSource.executionContext;

        if (
          connectionKey &&
          (!executionContext ||
            !this.connectionInfoResource.isKeyEqual(createConnectionParam(executionContext.projectId, executionContext.connectionId), connectionKey))
        ) {
          continue;
        }

        this.navigationTabsService.selectTab(tab.id);

        return true;
      }
    }

    return false;
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

  async executeQueries(editorId: string, queries: string[]): Promise<void> {
    const currentTab = this.navigationTabsService.findTab(isSQLEditorTab(tab => tab.id === editorId));

    if (!currentTab) {
      throw new Error(`SQL Editor tab with id "${editorId}" not found.`);
    }

    await this.sqlQueryService.executeQueries(currentTab.handlerState, queries);
  }

  private async navigateHandler(data: ISQLCreateAction | ISQLEditorAction, contexts: IExecutionContextProvider<ISQLCreateAction | ISQLEditorAction>) {
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
            data.dataSourceState,
            data.metadata,
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

export type SqlEditorNavigatorService = SqlEditorNavigatorServiceImpl;

export class SqlEditorNavigatorServiceDI extends Context.Service<SqlEditorNavigatorServiceDI, SqlEditorNavigatorServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-navigation-tab/SqlEditorNavigatorService#SqlEditorNavigatorService',
) {
  static readonly implementation = SqlEditorNavigatorServiceImpl;

  static readonly dependencies = () =>
    [
      NavigationTabsService,
      NotificationService,
      SqlEditorTabService,
      SqlResultTabsService,
      ConnectionInfoResource,
      NavigationService,
      SqlDataSourceService,
      SqlQueryService,
    ] as const;
  static readonly make: Effect.Effect<
    SqlEditorNavigatorServiceImpl,
    never,
    | Context.Service.Identifier<typeof NavigationTabsService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof SqlEditorTabService>
    | Context.Service.Identifier<typeof SqlResultTabsService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof NavigationService>
    | Context.Service.Identifier<typeof SqlDataSourceService>
    | Context.Service.Identifier<typeof SqlQueryService>
  > = Effect.gen(function* makeSqlEditorNavigatorService() {
    const navigationTabsService = yield* NavigationTabsService;
    const notificationService = yield* NotificationService;
    const sqlEditorTabService = yield* SqlEditorTabService;
    const sqlResultTabsService = yield* SqlResultTabsService;
    const connectionInfoResource = yield* ConnectionInfoResource;
    const navigationService = yield* NavigationService;
    const sqlDataSourceService = yield* SqlDataSourceService;
    const sqlQueryService = yield* SqlQueryService;

    return new SqlEditorNavigatorServiceImpl(
      navigationTabsService,
      notificationService,
      sqlEditorTabService,
      sqlResultTabsService,
      connectionInfoResource,
      navigationService,
      sqlDataSourceService,
      sqlQueryService,
    );
  });
  static readonly layer: Layer.Layer<
    SqlEditorNavigatorServiceDI,
    never,
    | Context.Service.Identifier<typeof NavigationTabsService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof SqlEditorTabService>
    | Context.Service.Identifier<typeof SqlResultTabsService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
    | Context.Service.Identifier<typeof NavigationService>
    | Context.Service.Identifier<typeof SqlDataSourceService>
    | Context.Service.Identifier<typeof SqlQueryService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorNavigatorService = SqlEditorNavigatorServiceDI;
