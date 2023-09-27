/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, KeyBindingService, MenuCheckboxItem, MenuService } from '@cloudbeaver/core-view';

import { ACTION_SQL_EDITOR_SHOW_OUTPUT } from '../../actions/ACTION_SQL_EDITOR_SHOW_OUTPUT';
import { KEY_BINDING_SQL_EDITOR_SHOW_OUTPUT } from '../../actions/bindings/KEY_BINDING_SQL_EDITOR_SHOW_OUTPUT';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../../DATA_CONTEXT_SQL_EDITOR_STATE';
import { ESqlDataSourceFeatures } from '../../SqlDataSource/ESqlDataSourceFeatures';
import { SqlDataSourceService } from '../../SqlDataSource/SqlDataSourceService';
import { SQL_EDITOR_ACTIONS_MENU } from '../../SqlEditor/SQL_EDITOR_ACTIONS_MENU';
import { ACTION_SHOW_OUTPUT_LOGS } from './ACTION_SHOW_OUTPUT_LOGS';
import { OUTPUT_LOG_TYPES } from './IOutputLogTypes';
import { OUTPUT_LOGS_FILTER_MENU } from './OUTPUT_LOGS_FILTER_MENU';
import { OutputLogsService } from './OutputLogsService';

@injectable()
export class OutputMenuBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly outputLogsService: OutputLogsService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly keyBindingService: KeyBindingService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.menuService.addCreator({
      menus: [OUTPUT_LOGS_FILTER_MENU],
      getItems: context => {
        const state = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (!state) {
          return [];
        }

        const outputLogsTabState = state?.outputLogsTab;
        const items = [];

        for (const logType of OUTPUT_LOG_TYPES) {
          items.push(
            new MenuCheckboxItem(
              {
                id: logType,
                label: logType,
                tooltip: logType,
              },
              {
                onSelect: () => {
                  if (outputLogsTabState?.selectedLogTypes) {
                    if (outputLogsTabState.selectedLogTypes.includes(logType)) {
                      outputLogsTabState.selectedLogTypes = outputLogsTabState.selectedLogTypes.filter(type => type !== logType);
                      return;
                    }
                    outputLogsTabState.selectedLogTypes = [...outputLogsTabState.selectedLogTypes, logType];
                  }
                },
              },
              {
                isChecked: () => !!outputLogsTabState?.selectedLogTypes.includes(logType),
              },
            ),
          );
        }

        return items;
      },
    });

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
          this.outputLogsService.showOutputLogs(state);
        }
      },
    });

    this.menuService.addCreator({
      menus: [SQL_EDITOR_ACTIONS_MENU],
      getItems: (context, items) => [...items, ACTION_SHOW_OUTPUT_LOGS],
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-show-output',
      binding: KEY_BINDING_SQL_EDITOR_SHOW_OUTPUT,
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_SHOW_OUTPUT,
      handler: (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (action === ACTION_SQL_EDITOR_SHOW_OUTPUT) {
          this.outputLogsService.showOutputLogs(state);
        }
      },
    });
  }

  async load(): Promise<void> {}
}
