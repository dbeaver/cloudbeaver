/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { MENU_TAB } from '@cloudbeaver/core-ui';
import { ActionService, ACTION_OPEN_IN_TAB, DATA_CONTEXT_MENU, IDataContextProvider, KeyBindingService, KEY_BINDING_OPEN_IN_TAB, MenuService, IAction } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '@cloudbeaver/plugin-sql-editor';
import { DATA_CONTEXT_SQL_EDITOR_TAB } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { SqlEditorScreenService } from './Screen/SqlEditorScreenService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly sqlEditorScreenService: SqlEditorScreenService,
    private readonly notificationService: NotificationService,
    private readonly menuService: MenuService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.actionService.addHandler({
      id: 'sql-editor-screen',
      isActionApplicable: (contexts, action) => (
        action === ACTION_OPEN_IN_TAB
        && contexts.has(DATA_CONTEXT_SQL_EDITOR_STATE)
      ),
      isDisabled: (context, action) => context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE)?.executionContext === undefined,
      handler: this.openTab.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor',
      binding: KEY_BINDING_OPEN_IN_TAB,
      isBindingApplicable: (contexts, action) => action === ACTION_OPEN_IN_TAB,
      handler: this.openTab.bind(this),
    });

    this.menuService.addCreator({
      isApplicable: context => (
        context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE) !== undefined
        && context.has(DATA_CONTEXT_SQL_EDITOR_TAB)
        && context.get(DATA_CONTEXT_MENU) === MENU_TAB
      ),
      getItems: (context, items) => [
        ACTION_OPEN_IN_TAB,
        ...items,
      ],
    });
  }

  private openTab(contexts: IDataContextProvider, action: IAction) {
    const context = contexts.get(DATA_CONTEXT_SQL_EDITOR_STATE);

    if (!context.executionContext) {
      this.notificationService.logError({
        title: 'sql_editor_screen_no_context_title',
        message: 'sql_editor_screen_no_context_message',
      });
      return;
    }

    const url = this.sqlEditorScreenService.createURL({
      contextId: context.executionContext.id,
    });

    window.open(url, '_blank')?.focus();
  }


  async load(): Promise<void> { }
}
