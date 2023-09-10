/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ACTION_REDO, ACTION_SAVE, ACTION_UNDO, IActiveView, View } from '@cloudbeaver/core-view';
import { ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

import { ACTION_SQL_EDITOR_EXECUTE } from './actions/ACTION_SQL_EDITOR_EXECUTE';
import { ACTION_SQL_EDITOR_EXECUTE_NEW } from './actions/ACTION_SQL_EDITOR_EXECUTE_NEW';
import { ACTION_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/ACTION_SQL_EDITOR_EXECUTE_SCRIPT';
import { ACTION_SQL_EDITOR_FORMAT } from './actions/ACTION_SQL_EDITOR_FORMAT';
import { ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN';
import { ACTION_SQL_EDITOR_SHOW_OUTPUT } from './actions/ACTION_SQL_EDITOR_SHOW_OUTPUT';

@injectable()
export class SqlEditorView extends View<ITab> {
  constructor(private readonly navigationTabsService: NavigationTabsService) {
    super();
    this.registerAction(
      ACTION_SQL_EDITOR_EXECUTE_NEW,
      ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
      ACTION_SQL_EDITOR_EXECUTE,
      ACTION_SQL_EDITOR_FORMAT,
      ACTION_UNDO,
      ACTION_REDO,
      ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      ACTION_SQL_EDITOR_SHOW_OUTPUT,
      ACTION_SAVE,
    );
  }

  getView(): IActiveView<ITab> | null {
    return this.navigationTabsService.getView();
  }
}
