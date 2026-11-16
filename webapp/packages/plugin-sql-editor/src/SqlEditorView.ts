/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ACTION_REDO, ACTION_SAVE, ACTION_UNDO, type IActiveView, View } from '@cloudbeaver/core-view';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

import { ACTION_SQL_EDITOR_EXECUTE } from './actions/ACTION_SQL_EDITOR_EXECUTE.js';
import { ACTION_SQL_EDITOR_EXECUTE_NEW } from './actions/ACTION_SQL_EDITOR_EXECUTE_NEW.js';
import { ACTION_SQL_EDITOR_EXECUTE_SCRIPT } from './actions/ACTION_SQL_EDITOR_EXECUTE_SCRIPT.js';
import { ACTION_SQL_EDITOR_FORMAT } from './actions/ACTION_SQL_EDITOR_FORMAT.js';
import { ACTION_SQL_EDITOR_SHOW_OUTPUT } from './actions/ACTION_SQL_EDITOR_SHOW_OUTPUT.js';

export class SqlEditorViewImpl extends View<ITab> {
  constructor(private readonly navigationTabsService: NavigationTabsService) {
    super();
    this.registerAction(
      ACTION_SQL_EDITOR_EXECUTE_NEW,
      ACTION_SQL_EDITOR_EXECUTE_SCRIPT,
      ACTION_SQL_EDITOR_EXECUTE,
      ACTION_SQL_EDITOR_FORMAT,
      ACTION_UNDO,
      ACTION_REDO,
      ACTION_SQL_EDITOR_SHOW_OUTPUT,
      ACTION_SAVE,
    );
  }

  getView(): IActiveView<ITab> | null {
    return this.navigationTabsService.getView();
  }
}

export type SqlEditorView = SqlEditorViewImpl;

export class SqlEditorViewDI extends Context.Service<SqlEditorViewDI, SqlEditorViewImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlEditorView#SqlEditorView',
) {
  static readonly implementation = SqlEditorViewImpl;

  static readonly dependencies = () => [NavigationTabsService] as const;
  static readonly make: Effect.Effect<SqlEditorViewImpl, never, Context.Service.Identifier<typeof NavigationTabsService>> = Effect.gen(
    function* makeSqlEditorView() {
      const navigationTabsService = yield* NavigationTabsService;

      return new SqlEditorViewImpl(navigationTabsService);
    },
  );
  static readonly layer: Layer.Layer<SqlEditorViewDI, never, Context.Service.Identifier<typeof NavigationTabsService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorView = SqlEditorViewDI;
