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
import { OUTPUT_LOG_TYPES } from './IOutputLogTypes';
import { OUTPUT_LOGS_TAB_ID } from './OUTPUT_LOGS_TAB_ID';
import type { IOutputLog } from './OutputLogsResource';

@injectable()
export class OutputLogsService {
  constructor(private readonly sqlDataSourceService: SqlDataSourceService) {}

  async showOutputLogs(editorState: ISqlEditorTabState): Promise<void> {
    this.createOutputLogsTab(editorState);
    editorState.currentTabId = OUTPUT_LOGS_TAB_ID;
  }

  removeOutputLogsTab(state: ISqlEditorTabState, tabId: string): void {
    if (tabId === OUTPUT_LOGS_TAB_ID) {
      state.outputLogsTab = undefined;
    }
  }

  private createOutputLogsTab(state: ISqlEditorTabState) {
    const order = Math.max(0, ...state.tabs.map(tab => tab.order + 1));

    if (state.tabs.find(tab => tab.id === OUTPUT_LOGS_TAB_ID)) {
      return;
    }

    const tab = {
      id: OUTPUT_LOGS_TAB_ID,
      name: 'Output',
      icon: '/icons/sql_output_logs.svg',
      order,
    };

    state.outputLogsTab = { ...tab, selectedLogTypes: [...OUTPUT_LOG_TYPES], wrapMode: true };
    state.tabs.push({ ...tab });
  }

  getOutputLogs(events: IOutputLog[], editorState: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(editorState.editorId);

    return events.filter(event => event.contextId === dataSource?.executionContext?.id);
  }
}
