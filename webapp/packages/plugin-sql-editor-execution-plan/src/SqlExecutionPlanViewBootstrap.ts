/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { SqlExecutionPlanViewService } from './SqlExecutionPlanViewService.js';

const ExecutionPlanTreeView = importLazyComponent(() => import('./ExecutionPlanTreeView.js').then(m => m.ExecutionPlanTreeView));

export class SqlExecutionPlanViewBootstrapImpl extends Bootstrap {
  constructor(private readonly sqlExecutionPlanViewService: SqlExecutionPlanViewService) {
    super();
  }

  override register(): void {
    this.sqlExecutionPlanViewService.tabs.add({
      key: 'table',
      name: 'plugin_sql_execution_plan_view_table',
      icon: 'table-icon',
      order: 0,
      panel: () => ExecutionPlanTreeView,
    });
  }
}

export type SqlExecutionPlanViewBootstrap = SqlExecutionPlanViewBootstrapImpl;

export class SqlExecutionPlanViewBootstrapDI extends Context.Service<SqlExecutionPlanViewBootstrapDI, SqlExecutionPlanViewBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor-execution-plan/SqlExecutionPlanViewBootstrap#SqlExecutionPlanViewBootstrap',
) {
  static readonly implementation = SqlExecutionPlanViewBootstrapImpl;

  static readonly dependencies = () => [SqlExecutionPlanViewService] as const;
  static readonly make: Effect.Effect<SqlExecutionPlanViewBootstrapImpl, never, Context.Service.Identifier<typeof SqlExecutionPlanViewService>> =
    Effect.gen(function* makeSqlExecutionPlanViewBootstrap() {
      const sqlExecutionPlanViewService = yield* SqlExecutionPlanViewService;

      return new SqlExecutionPlanViewBootstrapImpl(sqlExecutionPlanViewService);
    });
  static readonly layer: Layer.Layer<SqlExecutionPlanViewBootstrapDI, never, Context.Service.Identifier<typeof SqlExecutionPlanViewService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const SqlExecutionPlanViewBootstrap = SqlExecutionPlanViewBootstrapDI;
