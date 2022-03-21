/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ConnectionExecutionContextService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { ITask } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService, GraphQLService, SqlExecutionPlan } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState';

interface IExecutionPlanData {
  task: ITask<SqlExecutionPlan>;
  executionPlan: SqlExecutionPlan | null;
}

@injectable()
export class SqlExecutionPlanService {
  data: Map<string, IExecutionPlanData>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService
  ) {
    this.data = new Map();

    makeObservable(this, {
      data: observable,
    });
  }

  async executeExecutionPlan(
    editorState: ISqlEditorTabState,
    query: string,
  ): Promise<void> {
    const contextInfo = editorState.executionContext;

    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.id);

    if (!contextInfo || !executionContext) {
      console.error('executeExecutionPlan executionContext is not provided');
      return;
    }

    const tabId = this.createExecutionPlanTab(editorState, query);
    editorState.currentTabId = tabId;

    const asyncTask = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlExplainExecutionPlan({
        connectionId: contextInfo.connectionId,
        contextId: contextInfo.id,
        query,
        configuration: {},
      });

      return taskInfo;
    });

    const task = executionContext.run(
      async () => {
        const info = await this.asyncTaskInfoService.run(asyncTask);
        const { result } = await this.graphQLService.sdk.getSqlExecutionPlanResult({ taskId: info.id });

        return result;
      },
      () => this.asyncTaskInfoService.cancel(asyncTask.id),
      () => this.asyncTaskInfoService.remove(asyncTask.id)
    );

    this.data.set(tabId, {
      task,
      executionPlan: null,
    });

    try {
      const executionPlan = await task;

      const tab = editorState.tabs.find(tab => tab.id === tabId);

      if (!tab) { // tab can be closed before we get result
        return;
      }

      this.data.set(tabId, {
        task,
        executionPlan,
      });
    } catch (exception: any) {
      const cancelled = task.cancelled;
      const message = cancelled ? 'Execution plan process has been canceled' : undefined;
      this.notificationService.logException(exception, 'Execution plan Error', message);
      this.removeTab(editorState, tabId);

      if (!cancelled) {
        throw exception;
      }
    }
  }

  private removeTab(state: ISqlEditorTabState, tabId: string) {
    const tab = state.tabs.find(tab => tab.id === tabId);
    if (tab) {
      state.tabs.splice(state.tabs.indexOf(tab), 1);
    }
    this.removeExecutionPlanTab(state, tabId);

    if (state.tabs.length > 0) {
      state.currentTabId = state.tabs[0].id;
    } else {
      state.currentTabId = '';
    }
  }

  removeExecutionPlanTab(state: ISqlEditorTabState, tabId: string): void {
    const executionPlanTab = state.executionPlanTabs.find(executionPlanTab => executionPlanTab.tabId === tabId);

    if (executionPlanTab) {
      state.executionPlanTabs.splice(state.executionPlanTabs.indexOf(executionPlanTab), 1);
    }

    const data = this.data.get(tabId);

    if (data) {
      data.task.cancel();
    }

    this.data.delete(tabId);
  }

  private createExecutionPlanTab(state: ISqlEditorTabState, query: string) {
    if (!state.executionContext) {
      throw new Error('ExecutionContext is not provided');
    }

    const id = uuid();
    const order = Math.max(0, ...state.tabs.map(tab => tab.order + 1));
    const nameOrder = Math.max(1, ...state.executionPlanTabs.map(tab => tab.order + 1));

    state.executionPlanTabs.push({
      tabId: id,
      order: nameOrder,
      query,
    });

    state.tabs.push({
      id,
      name: `Execution plan - ${nameOrder}`,
      icon: 'execution-plan-tab',
      order,
    });

    return id;
  }
}
