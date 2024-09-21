/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { MENU_TAB } from '@cloudbeaver/core-ui';
import { ACTION_OPEN_IN_TAB, ActionService, type IAction, KEY_BINDING_OPEN_IN_TAB, KeyBindingService, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_SQL_EDITOR_STATE, SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { DATA_CONTEXT_SQL_EDITOR_TAB } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { SqlEditorScreenService } from './Screen/SqlEditorScreenService.js';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly sqlEditorScreenService: SqlEditorScreenService,
    private readonly notificationService: NotificationService,
    private readonly menuService: MenuService,
    private readonly sqlDataSourceService: SqlDataSourceService,
  ) {
    super();
  }

  override register(): void {
    this.actionService.addHandler({
      id: 'sql-editor-screen',
      actions: [ACTION_OPEN_IN_TAB],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      isDisabled: context => {
        const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        const dataSource = this.sqlDataSourceService.get(state.editorId);
        return dataSource?.executionContext === undefined;
      },
      handler: this.openTab.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor',
      binding: KEY_BINDING_OPEN_IN_TAB,
      actions: [ACTION_OPEN_IN_TAB],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE],
      handler: this.openTab.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_TAB],
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE, DATA_CONTEXT_SQL_EDITOR_TAB],
      getItems: (context, items) => [ACTION_OPEN_IN_TAB, ...items],
    });
  }

  private openTab(contexts: IDataContextProvider, action: IAction) {
    const context = contexts.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
    const dataSource = this.sqlDataSourceService.get(context.editorId);

    if (!dataSource?.executionContext) {
      this.notificationService.logError({
        title: 'sql_editor_screen_no_context_title',
        message: 'sql_editor_screen_no_context_message',
      });
      return;
    }

    const url = this.sqlEditorScreenService.createURL({
      contextId: dataSource.executionContext.id,
    });

    window.open(url, '_blank')?.focus();
  }
}
