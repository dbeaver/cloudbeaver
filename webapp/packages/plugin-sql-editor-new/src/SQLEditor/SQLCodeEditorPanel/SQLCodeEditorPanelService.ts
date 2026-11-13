/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ESqlDataSourceFeatures, SqlEditorModeService } from '@cloudbeaver/plugin-sql-editor';

const SQLCodeEditorPanel = importLazyComponent(() => import('./SQLCodeEditorPanel.js').then(module => module.SQLCodeEditorPanel));

export class SQLCodeEditorPanelServiceImpl {
  constructor(private readonly sqlEditorModeService: SqlEditorModeService) {}

  registerPanel(): void | Promise<void> {
    this.sqlEditorModeService.tabsContainer.add({
      key: 'sql-editor',
      icon: '/icons/sql_script_sm.svg',
      name: 'sql_editor_script_editor',
      isHidden: (_, props) => props?.data.model.dataSource?.hasFeature(ESqlDataSourceFeatures.script) !== true,
      panel: () => SQLCodeEditorPanel,
    });
  }
}

export type SQLCodeEditorPanelService = SQLCodeEditorPanelServiceImpl;

export class SQLCodeEditorPanelServiceDI extends Context.Service<SQLCodeEditorPanelServiceDI, SQLCodeEditorPanelServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-new/SQLEditor/SQLCodeEditorPanel/SQLCodeEditorPanelService#SQLCodeEditorPanelService',
) {
  static readonly implementation = SQLCodeEditorPanelServiceImpl;

  static readonly dependencies = () => [SqlEditorModeService] as const;
  static readonly make: Effect.Effect<SQLCodeEditorPanelServiceImpl, never, Context.Service.Identifier<typeof SqlEditorModeService>> = Effect.gen(
    function* makeSQLCodeEditorPanelService() {
      const sqlEditorModeService = yield* SqlEditorModeService;

      return new SQLCodeEditorPanelServiceImpl(sqlEditorModeService);
    },
  );
  static readonly layer: Layer.Layer<SQLCodeEditorPanelServiceDI, never, Context.Service.Identifier<typeof SqlEditorModeService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SQLCodeEditorPanelService = SQLCodeEditorPanelServiceDI;
