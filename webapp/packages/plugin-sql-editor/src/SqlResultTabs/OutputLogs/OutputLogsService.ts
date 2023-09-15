/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ActionService, MenuService } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../../DATA_CONTEXT_SQL_EDITOR_STATE';
import type { ISqlEditorTabState } from '../../ISqlEditorTabState';
import { ESqlDataSourceFeatures } from '../../SqlDataSource/ESqlDataSourceFeatures';
import { SqlDataSourceService } from '../../SqlDataSource/SqlDataSourceService';
import { SQL_EDITOR_ACTIONS_MENU } from '../../SqlEditor/SQL_EDITOR_ACTIONS_MENU';
import { ACTION_SHOW_OUTPUT_LOGS } from './ACTION_SHOW_OUTPUT_LOGS';
import { OUTPUT_LOGS_TAB_ID } from './OUTPUT_LOGS_TAB_ID';
import type { IOutputLog } from './OutputLogsResource';
import { OUTPUT_LOG_TYPES } from './useOutputLogsPanelState';

@injectable()
export class OutputLogsService {
  constructor(
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {
    this.registerOutputLogsAction();
  }

  private registerOutputLogsAction() {
    this.actionService.addHandler({
      id: 'output-logs-handler',
      isActionApplicable: (context, action): boolean => {
        const state = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (state && action === ACTION_SHOW_OUTPUT_LOGS) {
          const sqlDataSource = this.sqlDataSourceService.get(state.editorId);
          const isQuery = sqlDataSource?.hasFeature(ESqlDataSourceFeatures.query);
          const isExecutable = sqlDataSource?.hasFeature(ESqlDataSourceFeatures.executable);

          if (isQuery && isExecutable) {
            return true;
          }
        }

        return false;
      },

      handler: async (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (action === ACTION_SHOW_OUTPUT_LOGS) {
          this.showOutputLogs(state);
        }
      },
    });

    this.menuService.addCreator({
      menus: [SQL_EDITOR_ACTIONS_MENU],
      getItems: (context, items) => [...items, ACTION_SHOW_OUTPUT_LOGS],
    });
  }

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

    if (state.outputLogsTab) {
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

  getOutputLogs(events: IOutputLog[], editorState: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(editorState.editorId);

    return events.filter(event => event.contextId === dataSource?.executionContext?.id);
  }
}
