/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { ISqlEditorTabState, ISqlEditorResultTab } from '../ISqlEditorTabState';
import { SqlExecutionPlanService } from './ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryResultService } from './SqlQueryResultService';
import { SqlQueryService } from './SqlQueryService';

@injectable()
export class SqlResultTabsService {
  constructor(
    private sqlQueryService: SqlQueryService,
    private sqlQueryResultService: SqlQueryResultService,
    private sqlExecutionPlanService: SqlExecutionPlanService,
  ) {
    makeObservable(this, {
      removeResultTabs: action,
    });
  }

  selectResultTab(state: ISqlEditorTabState, resultId: string): void {
    state.currentTabId = resultId;
  }

  removeResultTab(state: ISqlEditorTabState, tabId: string): void {
    const tab = state.tabs.find(tab => tab.id === tabId);

    if (tab) {
      this.removeTab(state, tab);
    } else {
      console.warn(`Unable to remove tab. Tab with id="${tabId}" was not found`);
    }
  }

  removeResultTabs(state: ISqlEditorTabState): void {
    for (const tab of state.tabs.slice()) {
      this.removeTab(state, tab);
    }
  }

  private removeTab(state: ISqlEditorTabState, tab: ISqlEditorResultTab) {
    state.tabs.splice(state.tabs.indexOf(tab), 1);

    this.sqlQueryService.removeStatisticsTab(state, tab.id);
    this.sqlQueryResultService.removeResultTab(state, tab.id);
    this.sqlExecutionPlanService.removeExecutionPlanTab(state, tab.id);

    if (state.currentTabId === tab.id) {
      if (state.tabs.length > 0) {
        state.currentTabId = state.tabs[0].id;
      } else {
        state.currentTabId = '';
      }
    }
  }
}
