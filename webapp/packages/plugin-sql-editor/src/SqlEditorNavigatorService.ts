/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavigationTabsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { IExecutor, Executor, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { NavigationService } from '@cloudbeaver/core-ui';

import { SqlEditorTabService, isSQLEditorTab } from './SqlEditorTabService';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

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
    private notificationService: NotificationService,
    private sqlEditorTabService: SqlEditorTabService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    navigationService: NavigationService
  ) {
    this.navigator = new Executor<SQLCreateAction | SQLEditorAction>(
      null,
      (active, current) => active.type === current.type
    )
      .before(navigationService.navigationTask)
      .addHandler(this.navigateHandler.bind(this));
  }

  async openNewEditor(connectionId?: string, catalogId?: string, schemaId?: string): Promise<void> {
    await this.navigator.execute({
      type: SQLEditorNavigationAction.create,
      connectionId,
      catalogId,
      schemaId,
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

  private async navigateHandler(
    data: SQLCreateAction | SQLEditorAction,
    contexts: IExecutionContextProvider<SQLCreateAction | SQLEditorAction>
  ) {
    try {
      const tabInfo = contexts.getContext(this.navigationTabsService.navigationTabContext);

      if (data.type === SQLEditorNavigationAction.create) {
        const tabOptions = await this.sqlEditorTabService.createNewEditor(
          data.connectionId,
          data.catalogId,
          data.schemaId
        );

        if (tabOptions) {
          tabInfo.openNewTab(tabOptions);
        }
        return;
      }

      const tab = this.navigationTabsService.findTab(isSQLEditorTab(tab => tab.id === data.editorId));
      if (!tab) {
        return;
      }

      if (data.type === SQLEditorNavigationAction.select) {
        this.sqlEditorTabService.selectResultTab(tab.handlerState, data.resultId);
      } else if (data.type === SQLEditorNavigationAction.close) {
        await this.sqlResultTabsService.removeResultTab(tab.handlerState, data.resultId);
      }
      this.navigationTabsService.selectTab(tab.id);
    } catch (exception) {
      this.notificationService.logException(exception, 'SQL Editor Error', 'Error in SQL Editor while processing action with editor');
    }
  }
}
