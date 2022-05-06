/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITab, NavigationTabsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { IActiveView, View } from '@cloudbeaver/core-view';

import { ACTION_SQL_EDITOR_EXECUTE } from './actions/ACTION_SQL_EDITOR_EXECUTE';
import { ACTION_SQL_EDITOR_EXECUTE_NEW } from './actions/ACTION_SQL_EDITOR_EXECUTE_NEW';
import { ACTION_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/ACTION_SQL_EDITOR_EXECUTE_SCRIPT';
import { ACTION_SQL_EDITOR_FORMAT } from './actions/ACTION_SQL_EDITOR_FORMAT';
import { ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN';

@injectable()
export class SqlEditorView extends View<ITab> {
  constructor(
    private readonly navigationTabsService: NavigationTabsService
  ) {
    super();
    this.registerAction(
      ACTION_SQL_EDITOR_EXECUTE_NEW,
      ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
      ACTION_SQL_EDITOR_EXECUTE,
      ACTION_SQL_EDITOR_FORMAT,
      ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN
    );
  }

  getView(): IActiveView<ITab> | null {
    return this.navigationTabsService.getView();
  }

}