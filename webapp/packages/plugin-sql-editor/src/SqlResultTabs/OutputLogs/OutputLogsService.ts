/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState.js';
import { SqlDataSourceService } from '../../SqlDataSource/SqlDataSourceService.js';
import { OUTPUT_LOG_TYPES } from './IOutputLogTypes.js';
import { OUTPUT_LOGS_TAB_ID } from './OUTPUT_LOGS_TAB_ID.js';
import { type IOutputLog, OutputLogsResource } from './OutputLogsResource.js';

const OUTPUT_LOGS_KEY = 'output_logs';

interface ISettings {
  wrapMode: boolean;
}

@injectable()
export class OutputLogsService {
  get settings(): ISettings {
    return this.userDataService.getUserData(OUTPUT_LOGS_KEY, getOutputLogsDefaultSettings);
  }

  constructor(
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly userDataService: UserDataService,
    private readonly outputLogsResource: OutputLogsResource,
  ) {}

  showOutputLogs(editorState: ISqlEditorTabState): void {
    this.createOutputLogsTab(editorState);
    editorState.currentTabId = OUTPUT_LOGS_TAB_ID;
  }

  removeOutputLogsTab(state: ISqlEditorTabState, tabId: string): void {
    if (tabId === OUTPUT_LOGS_TAB_ID) {
      state.outputLogsTab = undefined;
    }
  }

  toggleWrapMode(): void {
    this.settings.wrapMode = !this.settings.wrapMode;
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

    state.outputLogsTab = { ...tab, selectedLogTypes: [...OUTPUT_LOG_TYPES] };
    state.tabs.push({ ...tab });
  }

  getOutputLogs(events: IOutputLog[], editorState: ISqlEditorTabState): IOutputLog[] {
    const dataSource = this.sqlDataSourceService.get(editorState.editorId);

    return events.filter(event => event.contextId === dataSource?.executionContext?.id);
  }

  clearOutputLogs(state: ISqlEditorTabState): void {
    const dataSource = this.sqlDataSourceService.get(state.editorId);
    const contextId = dataSource?.executionContext?.id;

    if (!contextId) {
      return;
    }

    this.outputLogsResource.deleteLogsByContextId(contextId);
  }
}

function getOutputLogsDefaultSettings(): ISettings {
  return {
    wrapMode: true,
  };
}
