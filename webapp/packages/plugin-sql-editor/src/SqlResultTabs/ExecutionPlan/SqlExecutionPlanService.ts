/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, SqlExecutionPlan } from '@cloudbeaver/core-sdk';
import { EDeferredState, uuid } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState';
import { SqlDialectInfoService } from '../../SqlDialectInfoService';
import type { SqlExecutionState } from '../../SqlExecutionState';
import { SQLExecutionPlanProcess } from './SQLExecutionPlanProcess';

interface IExecutionPlanData {
  query: string;
  executionPlan: SqlExecutionPlan;
}
@injectable()
export class SqlExecutionPlanService {
  results: Map<string, IExecutionPlanData>;
  processes: Map<string, SQLExecutionPlanProcess>;

  constructor(
    private sqlDialectInfoService: SqlDialectInfoService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
  ) {
    makeObservable(this, {
      results: observable,
      processes: observable,
    });
    this.results = new Map();
    this.processes = new Map();
  }

  async executeExecutionPlan(
    executionState: SqlExecutionState,
    editorState: ISqlEditorTabState,
    query: string,
  ): Promise<void> {
    if (!editorState.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const tabId = this.createExecutionPlanTab(editorState);
    const subQuery = await this.getSubQuery(editorState.executionContext.connectionId, query);
    const task = new SQLExecutionPlanProcess(this.graphQLService, this.notificationService);

    this.processes.set(tabId, task);
    executionState.setExecutionTask(task);
    editorState.currentTabId = tabId;

    try {
      await task.start(
        subQuery,
        {
          connectionId: editorState.executionContext?.connectionId,
          contextId: editorState.executionContext?.contextId,
        }
      );

      const executionPlan = await task.promise;
      this.results.set(tabId, {
        executionPlan,
        query,
      });
    } catch (exception) {
      const message = task.getState() === EDeferredState.CANCELLED ? 'Execution plan process has been canceled' : undefined;
      this.notificationService.logException(exception, 'Execution plan Error', message);
      this.removeTab(editorState, tabId);
    }
  }

  async getSubQuery(connectionId: string, query: string): Promise<string> {
    const dialectInfo = await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);

    if (dialectInfo?.scriptDelimiter && query.endsWith(dialectInfo?.scriptDelimiter)) {
      return query.slice(0, query.length - dialectInfo.scriptDelimiter.length);
    }

    return query;
  }

  private removeTab(state: ISqlEditorTabState, tabId: string) {
    this.removeExecutionPlanTab(state, tabId);

    if (state.tabs.length > 0) {
      state.currentTabId = state.tabs[0].id;
    } else {
      state.currentTabId = '';
    }
  }

  removeExecutionPlanTab(state: ISqlEditorTabState, tabId: string): void {
    const tab = state.tabs.find(tab => tab.id === tabId);
    const executionPlanTab = state.executionPlanTabs.find(executionPlanTab => executionPlanTab.tabId === tabId);

    if (executionPlanTab) {
      state.executionPlanTabs.splice(state.executionPlanTabs.indexOf(executionPlanTab), 1);
    }

    if (tab) {
      state.tabs.splice(state.tabs.indexOf(tab), 1);
    }

    this.results.delete(tabId);
    this.processes.delete(tabId);
  }

  private createExecutionPlanTab(
    state: ISqlEditorTabState,
  ) {
    if (!state.executionContext) {
      throw new Error('ExecutionContext is not provided');
    }

    const id = uuid();
    const order = Math.max(0, ...state.executionPlanTabs.map(tab => tab.order + 1));

    state.executionPlanTabs.push({
      tabId: id,
      executionContext: {
        connectionId: state.executionContext.connectionId,
        contextId: state.executionContext.contextId,
      },
      order,
    });

    state.tabs.push({
      id,
      name: `Execution plan - ${order + 1}`,
      icon: 'execution-plan-tab',
      order,
    });

    return id;
  }
}
