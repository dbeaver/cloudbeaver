/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';
import { TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import type { SqlExecutionState } from '../SqlExecutionState';
import { SQLExecutionPlanProcess } from './SQLExecutionPlanProcess';

@injectable()
export class SqlExecutionPlanService {
  constructor(
    private sqlDialectInfoService: SqlDialectInfoService,
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
  ) { }

  async executeExecutionPlan(
    executionState: SqlExecutionState,
    editorState: ISqlEditorTabState,
    query: string,
  ): Promise<void> {
    if (!editorState.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const process = new SQLExecutionPlanProcess(this.graphQLService, this.notificationService);
    await process.start(await this.getSubQuery(editorState.executionContext.connectionId, query),
      {
        connectionId: editorState.executionContext?.connectionId,
        contextId: editorState.executionContext?.contextId,
      }
    );

    const result = await process.promise;

    this.createExecutionPlanTab(editorState, await this.getSubQuery(editorState.executionContext.connectionId, query));

    console.log(result);
  }

  async getSubQuery(connectionId: string, query: string): Promise<string> {
    const dialectInfo = await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);

    if (dialectInfo?.scriptDelimiter && query.endsWith(dialectInfo?.scriptDelimiter)) {
      return query.slice(0, query.length - dialectInfo.scriptDelimiter.length);
    }

    return query;
  }

  removeResultTab(state: ISqlEditorTabState, tabId: string): void {
    const resultTab = state.resultTabs.find(resultTab => resultTab.tabId === tabId);
    const group = state.resultGroups.find(group => group.groupId === resultTab?.groupId);

    if (resultTab && group) {
      state.resultTabs.splice(state.resultTabs.indexOf(resultTab), 1);

      const isGroupEmpty = !state.resultTabs.some(resultTab => resultTab.groupId === group.groupId);

      if (isGroupEmpty) {
        state.resultGroups.splice(state.resultGroups.indexOf(group), 1);
        // TODO: probably we should cleanup some data before model delete
        this.tableViewerStorageService.remove(group.modelId);
      }
    }
  }

  private createExecutionPlanTab(
    state: ISqlEditorTabState,
    query: string,
  ) {
    if (!state.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const id = uuid();

    state.executionPlanTabs.push({
      tabId: id,
      executionContext: {
        connectionId: state.executionContext.connectionId,
        contextId: state.executionContext.contextId,
      },
      query,
    });

    state.tabs.push({
      id,
      name: 'Execution plan',
      icon: '/icons/grid.png',
      order: state.executionPlanTabs.length + 1,
    });
  }
}
