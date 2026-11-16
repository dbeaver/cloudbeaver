/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ActionService, KeyBindingService, MenuCheckboxItem, MenuService } from '@cloudbeaver/core-view';

import { ACTION_SQL_EDITOR_SHOW_OUTPUT } from '../../actions/ACTION_SQL_EDITOR_SHOW_OUTPUT.js';
import { KEY_BINDING_SQL_EDITOR_SHOW_OUTPUT } from '../../actions/bindings/KEY_BINDING_SQL_EDITOR_SHOW_OUTPUT.js';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../../DATA_CONTEXT_SQL_EDITOR_STATE.js';
import { ESqlDataSourceFeatures } from '../../SqlDataSource/ESqlDataSourceFeatures.js';
import { SqlDataSourceService } from '../../SqlDataSource/SqlDataSourceService.js';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from '../../SqlEditor/DATA_CONTEXT_SQL_EDITOR_DATA.js';
import { SQL_EDITOR_ACTIONS_MENU } from '../../SqlEditor/SQL_EDITOR_ACTIONS_MENU.js';
import { ACTION_SQL_EDITOR_CLEAR_OUTPUT_LOGS } from './ACTION_SQL_EDITOR_CLEAR_OUTPUT_LOGS.js';
import { OUTPUT_LOG_TYPES } from './IOutputLogTypes.js';
import { OUTPUT_LOGS_FILTER_MENU } from './OUTPUT_LOGS_FILTER_MENU.js';
import { OUTPUT_LOGS_MENU } from './OUTPUT_LOGS_MENU.js';
import { OUTPUT_LOGS_SETTINGS_MENU } from './OUTPUT_LOGS_SETTINGS_MENU.js';
import { OutputLogsService } from './OutputLogsService.js';

export class OutputMenuBootstrapImpl extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly outputLogsService: OutputLogsService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly keyBindingService: KeyBindingService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [OUTPUT_LOGS_MENU],
      getItems(context, items) {
        return [...items, ACTION_SQL_EDITOR_CLEAR_OUTPUT_LOGS, OUTPUT_LOGS_FILTER_MENU, OUTPUT_LOGS_SETTINGS_MENU];
      },
    });

    this.menuService.addCreator({
      menus: [OUTPUT_LOGS_FILTER_MENU],
      getItems: (context, items) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (!state) {
          return [];
        }

        const outputLogsTabState = state?.outputLogsTab;
        const result = [];

        for (const logType of OUTPUT_LOG_TYPES) {
          result.push(
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

        return [...items, ...result];
      },
    });

    this.menuService.addCreator({
      menus: [OUTPUT_LOGS_SETTINGS_MENU],
      getItems: (context, items) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (!state) {
          return [];
        }

        const wrapMode = new MenuCheckboxItem(
          {
            id: 'wrap-mode',
            label: 'sql_editor_output_logs_wrap_mode',
            tooltip: 'sql_editor_output_logs_wrap_mode',
          },
          {
            onSelect: () => {
              this.outputLogsService.toggleWrapMode();
            },
          },
          {
            isChecked: () => this.outputLogsService.settings.wrapMode,
          },
        );

        return [...items, wrapMode];
      },
    });

    this.registerOutputLogsAction();
  }

  private registerOutputLogsAction() {
    this.actionService.addHandler({
      id: 'output-logs-handler',
      actions: [ACTION_SQL_EDITOR_SHOW_OUTPUT, ACTION_SQL_EDITOR_CLEAR_OUTPUT_LOGS],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE, DATA_CONTEXT_SQL_EDITOR_DATA],
      isActionApplicable: (context): boolean => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
        const sqlEditorData = context.get(DATA_CONTEXT_SQL_EDITOR_DATA);

        const sqlDataSource = this.sqlDataSourceService.get(state.editorId);
        const isQuery = sqlDataSource?.hasFeature(ESqlDataSourceFeatures.query);
        const isExecutable = sqlEditorData?.isExecutionAllowed();

        return !!isQuery && !!isExecutable;
      },

      handler: (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        if (action === ACTION_SQL_EDITOR_SHOW_OUTPUT) {
          this.outputLogsService.showOutputLogs(state);
        }

        if (action === ACTION_SQL_EDITOR_CLEAR_OUTPUT_LOGS) {
          this.outputLogsService.clearOutputLogs(state);
        }
      },
    });

    this.menuService.addCreator({
      menus: [SQL_EDITOR_ACTIONS_MENU],
      getItems: (context, items) => [...items, ACTION_SQL_EDITOR_SHOW_OUTPUT],
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-show-output',
      binding: KEY_BINDING_SQL_EDITOR_SHOW_OUTPUT,
      actions: [ACTION_SQL_EDITOR_SHOW_OUTPUT],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      handler: (context, action) => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        if (action === ACTION_SQL_EDITOR_SHOW_OUTPUT) {
          this.outputLogsService.showOutputLogs(state);
        }
      },
    });
  }
}

export type OutputMenuBootstrap = OutputMenuBootstrapImpl;

export class OutputMenuBootstrapDI extends Context.Service<OutputMenuBootstrapDI, OutputMenuBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlResultTabs/OutputLogs/OutputMenuBootstrap#OutputMenuBootstrap',
) {
  static readonly implementation = OutputMenuBootstrapImpl;

  static readonly dependencies = () => [ActionService, MenuService, OutputLogsService, SqlDataSourceService, KeyBindingService] as const;
  static readonly make: Effect.Effect<
    OutputMenuBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof OutputLogsService>
    | Context.Service.Identifier<typeof SqlDataSourceService>
    | Context.Service.Identifier<typeof KeyBindingService>
  > = Effect.gen(function* makeOutputMenuBootstrap() {
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;
    const outputLogsService = yield* OutputLogsService;
    const sqlDataSourceService = yield* SqlDataSourceService;
    const keyBindingService = yield* KeyBindingService;

    return new OutputMenuBootstrapImpl(actionService, menuService, outputLogsService, sqlDataSourceService, keyBindingService);
  });
  static readonly layer: Layer.Layer<
    OutputMenuBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof OutputLogsService>
    | Context.Service.Identifier<typeof SqlDataSourceService>
    | Context.Service.Identifier<typeof KeyBindingService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const OutputMenuBootstrap = OutputMenuBootstrapDI;
