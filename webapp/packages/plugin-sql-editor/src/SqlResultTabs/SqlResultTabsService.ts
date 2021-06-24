/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlExecutionState } from '../SqlExecutionState';
import { SqlExecutionPlanService } from './ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryService } from './SqlQueryService';

@injectable()
export class SqlResultTabsService {
  private tabExecutionContext: MetadataMap<string, SqlExecutionState>;

  constructor(
    private sqlQueryService: SqlQueryService,
    private sqlExecutionPlanService: SqlExecutionPlanService,
    private notificationService: NotificationService,
  ) {
    this.tabExecutionContext = new MetadataMap(() => new SqlExecutionState());
  }

  getTabExecutionContext(tabId: string): SqlExecutionState {
    return this.tabExecutionContext.get(tabId);
  }

  async removeResultTab(state: ISqlEditorTabState, tabId: string, editorTabId: string): Promise<void> {
    const editorTabExecutionContext = this.getTabExecutionContext(editorTabId);
    if (editorTabExecutionContext.isExecuting || editorTabExecutionContext.isCanceling) {
      this.notificationService.logInfo({ title: 'sql_tab_closing_notification_title', message: 'sql_tab_closing_notification_message' });
      return;
    }

    const tab = state.tabs.find(tab => tab.id === tabId);

    if (tab) {
      state.tabs.splice(state.tabs.indexOf(tab), 1);
    }

    this.sqlQueryService.removeResultTab(state, tabId);
    this.sqlExecutionPlanService.removeExecutionPlanTab(state, tabId);

    if (state.currentTabId === tabId) {
      if (state.tabs.length > 0) {
        state.currentTabId = state.tabs[0].id;
      } else {
        state.currentTabId = '';
      }
    }
  }
}
