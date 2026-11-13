/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ActionService, KeyBindingService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import {
  ACTION_SQL_EDITOR_SHOW_OUTPUT,
  DATA_CONTEXT_SQL_EDITOR_DATA,
  ESqlDataSourceFeatures,
  SQL_EDITOR_ACTIONS_MENU,
  SqlEditorView,
} from '@cloudbeaver/plugin-sql-editor';

import { ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN.js';
import { KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN } from './actions/bindings/KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN.js';
import { SqlExecutionPlanService } from './SqlExecutionPlanService.js';

export class SqlExecutionPlanMenuBootstrapImpl extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly sqlEditorView: SqlEditorView,
    private readonly sqlExecutionPlanService: SqlExecutionPlanService,
  ) {
    super();
  }

  override register(): void {
    this.sqlEditorView.registerAction(ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN);

    this.menuService.addCreator({
      menus: [SQL_EDITOR_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      getItems: (context, items) => [...items, ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN],
      orderItems: (_context, items) => {
        const extracted = menuExtractItems(items, [ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN]);
        const outputIndex = items.indexOf(ACTION_SQL_EDITOR_SHOW_OUTPUT);
        items.splice(outputIndex !== -1 ? outputIndex : items.length, 0, ...extracted);

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'sql-editor-execution-plan',
      actions: [ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN],
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isActionApplicable: contexts => {
        const data = contexts.get(DATA_CONTEXT_SQL_EDITOR_DATA);

        if (!data || !data.isExecutionAllowed()) {
          return false;
        }

        return !!data.model.dataSource?.hasFeature(ESqlDataSourceFeatures.query) && !!data.dialect?.supportsExplainExecutionPlan;
      },
      isDisabled: context => {
        const data = context.get(DATA_CONTEXT_SQL_EDITOR_DATA);
        return !data || data.isDisabled || data.isScriptEmpty;
      },
      getActionInfo: (context, action) => ({ ...action.info, label: '' }),
      handler: this.showExecutionPlan.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'sql-editor-show-execution-plan',
      binding: KEY_BINDING_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      contexts: [DATA_CONTEXT_SQL_EDITOR_DATA],
      isBindingApplicable: (contexts, action) => action === ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN,
      handler: this.showExecutionPlan.bind(this),
    });
  }

  private async showExecutionPlan(context: IDataContextProvider): Promise<void> {
    const data = context.get(DATA_CONTEXT_SQL_EDITOR_DATA);

    if (!data) {
      return;
    }

    const isQuery = data.model.dataSource?.hasFeature(ESqlDataSourceFeatures.query);

    if (!isQuery || !data.isExecutionAllowed() || !data.dialect?.supportsExplainExecutionPlan) {
      return;
    }

    try {
      const segment = await data.model.getResolvedSegment();
      await data.executeQueryAction(segment, query => this.sqlExecutionPlanService.executeExecutionPlan(data.state, query.query));
    } catch {}
  }
}

export type SqlExecutionPlanMenuBootstrap = SqlExecutionPlanMenuBootstrapImpl;

export class SqlExecutionPlanMenuBootstrapDI extends Context.Service<SqlExecutionPlanMenuBootstrapDI, SqlExecutionPlanMenuBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor-execution-plan/SqlExecutionPlanMenuBootstrap#SqlExecutionPlanMenuBootstrap',
) {
  static readonly implementation = SqlExecutionPlanMenuBootstrapImpl;

  static readonly dependencies = () => [MenuService, ActionService, KeyBindingService, SqlEditorView, SqlExecutionPlanService] as const;
  static readonly make: Effect.Effect<
    SqlExecutionPlanMenuBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof KeyBindingService>
    | Context.Service.Identifier<typeof SqlEditorView>
    | Context.Service.Identifier<typeof SqlExecutionPlanService>
  > = Effect.gen(function* makeSqlExecutionPlanMenuBootstrap() {
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const keyBindingService = yield* KeyBindingService;
    const sqlEditorView = yield* SqlEditorView;
    const sqlExecutionPlanService = yield* SqlExecutionPlanService;

    return new SqlExecutionPlanMenuBootstrapImpl(menuService, actionService, keyBindingService, sqlEditorView, sqlExecutionPlanService);
  });
  static readonly layer: Layer.Layer<
    SqlExecutionPlanMenuBootstrapDI,
    never,
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof KeyBindingService>
    | Context.Service.Identifier<typeof SqlEditorView>
    | Context.Service.Identifier<typeof SqlExecutionPlanService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlExecutionPlanMenuBootstrap = SqlExecutionPlanMenuBootstrapDI;
