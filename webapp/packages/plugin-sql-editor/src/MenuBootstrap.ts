/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { ActionService, KeyBindingService, MenuService, IAction, IDataContextProvider } from '@cloudbeaver/core-view';
import { DatabaseEditAction, TableFooterMenuService } from '@cloudbeaver/plugin-data-viewer';

import { ACTION_SQL_EDITOR_EXECUTE } from './actions/ACTION_SQL_EDITOR_EXECUTE';
import { ACTION_SQL_EDITOR_EXECUTE_NEW } from './actions/ACTION_SQL_EDITOR_EXECUTE_NEW';
import { ACTION_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/ACTION_SQL_EDITOR_EXECUTE_SCRIPT';
import { ACTION_SQL_EDITOR_FORMAT } from './actions/ACTION_SQL_EDITOR_FORMAT';
import { ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN';
import { KEY_BINDING_SQL_EDITOR_EXECUTE } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE';
import { KEY_BINDING_SQL_EDITOR_EXECUTE_NEW } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE_NEW';
import { KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/bindings/KEY_BINDING_SQL_EDITOR_EXECUTE_SCRIPT';
import { KEY_BINDING_SQL_EDITOR_FORMAT } from './actions/bindings/KEY_BINDING_SQL_EDITOR_FORMAT';
import { KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/bindings/KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN';
import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './SqlEditor/DATA_CONTEXT_SQL_EDITOR_DATA';

@injectable()
export class MenuBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly scriptPreviewService: ScriptPreviewService,
    private readonly tableFooterMenuService: TableFooterMenuService,
    private readonly menuService: MenuService
  ) {
    super();
  }

  register(): void {
    this.actionService.addHandler({
      id: 'sql-editor-actions',
      isActionApplicable: (contexts, action) => (
        [
          ACTION_SQL_EDITOR_EXECUTE,
          ACTION_SQL_EDITOR_EXECUTE_NEW,
          ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
          ACTION_SQL_EDITOR_FORMAT,
          ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
        ].includes(action)
        && contexts.has(DATA_CONTEXT_SQL_EDITOR_DATA)
      ),
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
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
      handler: this.sqlEditorActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-format',
      binding: KEY_BINDING_SQL_EDITOR_FORMAT,
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_FORMAT,
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

    this.tableFooterMenuService.registerMenuItem({
      id: 'script',
      order: 3,
      title: 'data_viewer_script_preview',
      tooltip: 'data_viewer_script_preview',
      icon: 'sql-script-preview',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        return context.data.model.isReadonly(context.data.resultIndex)
          || context.data.model.source.getResult(context.data.resultIndex)?.dataFormat !== ResultDataFormat.Resultset;
      },
      isDisabled(context) {
        if (
          context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.source.hasResult(context.data.resultIndex)
        ) {
          return true;
        }
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );
        return !editor?.isEdited();
      },
      onClick: async context => {
        await this.scriptPreviewService.open(context.data.model, context.data.resultIndex);
      },
    });
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
      case ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN:
        data.showExecutionPlan();
        break;
    }
  }

  load(): void | Promise<void> { }
}