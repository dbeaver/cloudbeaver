/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState';
import { SqlDataSourceService } from '../../SqlDataSource/SqlDataSourceService';

@injectable()
export class OutputLogsService {
  constructor(private readonly sqlDataSourceService: SqlDataSourceService) {}

  async showOutputLogs(editorState: ISqlEditorTabState): Promise<void> {
    const tabId = this.createOutputLogsTab(editorState);
    editorState.currentTabId = tabId;
  }

  removeOutputLogsTab(state: ISqlEditorTabState, tabId: string): void {
    const outputLogsTab = state.tabs.find(outputLogsTab => outputLogsTab.id === tabId);

    if (outputLogsTab) {
      state.tabs.splice(state.tabs.indexOf(outputLogsTab), 1);
    }
  }

  private createOutputLogsTab(state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);
    if (!dataSource) {
      throw new Error('SQL Data Source is not provided');
    }

    const id = 'output-logs';
    const order = Math.max(0, ...state.tabs.map(tab => tab.order + 1));

    if (state.tabs.find(tab => tab.id === id)) {
      return;
    }

    state.outputLogsTab = {
      tabId: id,
      order,
    };

    state.tabs.push({
      id,
      name: 'Output',
      icon: 'execution-plan-tab', // todo change icon
      order,
    });

    return id;
  }
}
