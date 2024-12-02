/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import type { ISqlEditorResultTab, ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { SqlExecutionPlanService } from './ExecutionPlan/SqlExecutionPlanService.js';
import { OutputLogsService } from './OutputLogs/OutputLogsService.js';
import { SqlQueryResultService } from './SqlQueryResultService.js';
import { SqlQueryService } from './SqlQueryService.js';

@injectable()
export class SqlResultTabsService {
  constructor(
    private readonly sqlQueryService: SqlQueryService,
    private readonly sqlQueryResultService: SqlQueryResultService,
    private readonly sqlExecutionPlanService: SqlExecutionPlanService,
    private readonly sqlOutputLogsService: OutputLogsService,
  ) {
    makeObservable(this, {
      removeResultTabs: action,
    });
  }

  getResultTabs(state: ISqlEditorTabState) {
    return state.resultTabs;
  }

  async canCloseResultTab(state: ISqlEditorTabState, tabId: string): Promise<boolean> {
    const tab = state.tabs.find(tab => tab.id === tabId);

    if (tab) {
      return await this.sqlQueryResultService.canCloseResultTab(state, tab.id);
    }

    return true;
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

  async canCloseResultTabs(state: ISqlEditorTabState): Promise<boolean> {
    for (const tab of state.tabs) {
      const canClose = await this.sqlQueryResultService.canCloseResultTab(state, tab.id);

      if (!canClose) {
        return false;
      }
    }

    return true;
  }

  removeResultTabs(state: ISqlEditorTabState, excludedTabIds?: string[]): void {
    const tabs = state.tabs.slice();

    for (const tab of tabs) {
      if (excludedTabIds?.includes(tab.id)) {
        continue;
      }
      this.removeTab(state, tab);
    }
  }

  private removeTab(state: ISqlEditorTabState, tab: ISqlEditorResultTab) {
    state.tabs.splice(state.tabs.indexOf(tab), 1);

    this.sqlQueryService.removeStatisticsTab(state, tab.id);
    this.sqlQueryResultService.removeResultTab(state, tab.id);
    this.sqlExecutionPlanService.removeExecutionPlanTab(state, tab.id);
    this.sqlOutputLogsService.removeOutputLogsTab(state, tab.id);

    if (state.currentTabId === tab.id) {
      if (state.tabs.length > 0) {
        state.currentTabId = state.tabs[0]!.id;
      } else {
        state.currentTabId = '';
      }
    }
  }
}
