/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { WindowEventsService } from '@cloudbeaver/core-root';
import { throttle } from '@cloudbeaver/core-utils';
import {
  ACTION_REDO,
  ACTION_SAVE,
  ACTION_UNDO,
  ActionService,
  DATA_CONTEXT_MENU,
  IAction,
  KEY_BINDING_REDO,
  KEY_BINDING_SAVE,
  KEY_BINDING_UNDO,
  KeyBindingService,
  MenuService,
} from '@cloudbeaver/core-view';

import { ACTION_SQL_EDITOR_EXECUTE } from './actions/ACTION_SQL_EDITOR_EXECUTE';
import { ACTION_SQL_EDITOR_EXECUTE_NEW } from './actions/ACTION_SQL_EDITOR_EXECUTE_NEW';
import { ACTION_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/ACTION_SQL_EDITOR_EXECUTE_SCRIPT';
import { ACTION_SQL_EDITOR_FORMAT } from './actions/ACTION_SQL_EDITOR_FORMAT';
import { ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN';
import { ACTION_SQL_EDITOR_SHOW_OUTPUT } from './actions/ACTION_SQL_EDITOR_SHOW_OUTPUT';
import { KEY_BINDING_SQL_EDITOR_EXECUTE } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE';
import { KEY_BINDING_SQL_EDITOR_EXECUTE_NEW } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE_NEW';
import { KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT';
import { KEY_BINDING_SQL_EDITOR_FORMAT } from './actions/bindings/KEY_BINDING_SQL_EDITOR_FORMAT';
import { KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/bindings/KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from './DATA_CONTEXT_SQL_EDITOR_STATE';
import { ESqlDataSourceFeatures } from './SqlDataSource/ESqlDataSourceFeatures';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './SqlEditor/DATA_CONTEXT_SQL_EDITOR_DATA';
import { SQL_EDITOR_TOOLS_MENU } from './SqlEditor/SQL_EDITOR_TOOLS_MENU';

const SYNC_DELAY = 5 * 60 * 1000;

@injectable()
export class MenuBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly windowEventsService: WindowEventsService,
  ) {
    super();
  }

  register(): void {
    this.windowEventsService.onFocusChange.addHandler(throttle(this.focusChangeHandler.bind(this), SYNC_DELAY, false));
    this.actionService.addHandler({
      id: 'sql-editor-base-handler',
      isActionApplicable: (context, action): boolean => {
        const state = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (!state) {
          return false;
        }

        const dataSource = this.sqlDataSourceService.get(state.editorId);

        if (action === ACTION_SAVE) {
          return dataSource?.isAutoSaveEnabled === false;
        }

        return false;
      },
      handler: async (context, action) => {
        if (action === ACTION_SAVE) {
          const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);
          const source = this.sqlDataSourceService.get(state.editorId);

          if (!source) {
            return;
          }

          await source.save();
        }
      },
      isDisabled: (context, action) => {
        if (action === ACTION_SAVE) {
          const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);
          const source = this.sqlDataSourceService.get(state.editorId);

          if (!source) {
            return true;
          }

          return source.isLoading() || source.isSaved || source.isReadonly();
        }

        return false;
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_SAVE) {
          return {
            ...action.info,
            label: '',
          };
        }

        return action.info;
      },
    });

    this.menuService.addCreator({
      isApplicable: context => {
        const state = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

        if (!state) {
          return false;
        }

        const dataSource = this.sqlDataSourceService.get(state.editorId);

        return context.get(DATA_CONTEXT_MENU) === SQL_EDITOR_TOOLS_MENU && !!dataSource?.hasFeature(ESqlDataSourceFeatures.script);
      },
      getItems: (context, items) => [...items, ACTION_SAVE],
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-save',
      binding: KEY_BINDING_SAVE,
      isBindingApplicable: (context, action) => action === ACTION_SAVE,
      handler: async context => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);
        const source = this.sqlDataSourceService.get(state.editorId);

        if (!source) {
          return;
        }

        await source.save();
      },
    });

    this.actionService.addHandler({
      id: 'sql-editor-actions',
      isActionApplicable: (contexts, action): boolean => {
        const sqlEditorData = contexts.tryGet(DATA_CONTEXT_SQL_EDITOR_DATA);

        if (!sqlEditorData) {
          return false;
        }

        if (sqlEditorData.readonly && [ACTION_SQL_EDITOR_FORMAT, ACTION_REDO, ACTION_UNDO].includes(action)) {
          return false;
        }

        if (
          !sqlEditorData.dataSource?.hasFeature(ESqlDataSourceFeatures.executable) &&
          [
            ACTION_SQL_EDITOR_EXECUTE,
            ACTION_SQL_EDITOR_EXECUTE_NEW,
            ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
            ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
            ACTION_SQL_EDITOR_SHOW_OUTPUT,
          ].includes(action)
        ) {
          return false;
        }

        // TODO we have to add check for output action ?
        if (
          !sqlEditorData.dataSource?.hasFeature(ESqlDataSourceFeatures.query) &&
          [ACTION_SQL_EDITOR_EXECUTE, ACTION_SQL_EDITOR_EXECUTE_NEW, ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN].includes(action)
        ) {
          return false;
        }

        return [
          ACTION_SQL_EDITOR_EXECUTE,
          ACTION_SQL_EDITOR_EXECUTE_NEW,
          ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
          ACTION_SQL_EDITOR_FORMAT,
          ACTION_REDO,
          ACTION_UNDO,
          ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
          ACTION_SQL_EDITOR_SHOW_OUTPUT,
        ].includes(action);
      },
      isDisabled: (context, action) => !context.has(DATA_CONTEXT_SQL_EDITOR_DATA),
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-execute',
      binding: KEY_BINDING_SQL_EDITOR_EXECUTE,
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_EXECUTE,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-execute-new',
      binding: KEY_BINDING_SQL_EDITOR_EXECUTE_NEW,
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_EXECUTE_NEW,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-execute-script',
      binding: KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT,
      isBindingApplicable: (contexts, action) => {
        const sqlEditorData = contexts.tryGet(DATA_CONTEXT_SQL_EDITOR_DATA);
        return action === ACTION_SQL_EDITOR_EXECUTE_SCRIPT && sqlEditorData?.dataSource?.hasFeature(ESqlDataSourceFeatures.executable) === true;
      },
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-format',
      binding: KEY_BINDING_SQL_EDITOR_FORMAT,
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_FORMAT,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-redo',
      binding: KEY_BINDING_REDO,
      isBindingApplicable: (contexts, action) => action === ACTION_REDO,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-undo',
      binding: KEY_BINDING_UNDO,
      isBindingApplicable: (contexts, action) => action === ACTION_UNDO,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-show-execution-plan',
      binding: KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    // this.menuService.addCreator({
    //   isApplicable: context => (
    //     context.tryGet(DATA_CONTEXT_SQL_EDITOR_DATA) !== undefined
    //     && context.get(DATA_CONTEXT_MENU) === MENU_TAB
    //   ),
    //   getItems: (context, items) => [
    //     KEY_BINDING_SQL_EDITOR_EXECUTE,
    //     ...items,
    //   ],
    // });
  }

  private sqlEditorActionHandler(context: IDataContextProvider, action: IAction): void {
    const data = context.get(DATA_CONTEXT_SQL_EDITOR_DATA);

    switch (action) {
      case ACTION_SQL_EDITOR_EXECUTE:
        data.executeQuery();
        break;
      case ACTION_SQL_EDITOR_EXECUTE_NEW:
        data.executeQueryNewTab();
        break;
      case ACTION_SQL_EDITOR_EXECUTE_SCRIPT:
        if (data.activeSegmentMode.activeSegmentMode) {
          return;
        }

        data.executeScript();
        break;
      case ACTION_SQL_EDITOR_FORMAT:
        if (data.activeSegmentMode.activeSegmentMode) {
          return;
        }

        data.formatScript();
        break;
      case ACTION_UNDO:
        data.dataSource?.history.undo();
        break;
      case ACTION_REDO:
        data.dataSource?.history.redo();
        break;
      case ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN:
        data.showExecutionPlan();
        break;
    }
  }

  private async focusChangeHandler(focused: boolean) {
    if (focused) {
      const dataSources = this.sqlDataSourceService.dataSources.values();

      for (const [_, dataSource] of dataSources) {
        dataSource.markOutdated();
      }
    }
  }
}
