/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SqlResultTabsService } from '@cloudbeaver/plugin-sql-editor';

import { SqlExecutionPlanService } from './SqlExecutionPlanService.js';

const SqlExecutionPlanPanel = importLazyComponent(() => import('./SqlExecutionPlanPanel.js').then(module => module.SqlExecutionPlanPanel));

export class SqlExecutionPlanResultBootstrapImpl extends Bootstrap {
  constructor(
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly sqlExecutionPlanService: SqlExecutionPlanService,
  ) {
    super();

    this.sqlResultTabsService.onResultTabClose.addHandler(({ state, tabId }) => {
      this.sqlExecutionPlanService.removeExecutionPlanTab(state, tabId);
    });
  }

  override register(): void {
    this.sqlResultTabsService.resultPanels.add(SqlExecutionPlanPanel, 0, ({ tabId }) => !this.sqlExecutionPlanService.has(tabId));
  }
}

export type SqlExecutionPlanResultBootstrap = SqlExecutionPlanResultBootstrapImpl;

export class SqlExecutionPlanResultBootstrapDI extends Context.Service<SqlExecutionPlanResultBootstrapDI, SqlExecutionPlanResultBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor-execution-plan/SqlExecutionPlanResultBootstrap#SqlExecutionPlanResultBootstrap',
) {
  static readonly implementation = SqlExecutionPlanResultBootstrapImpl;

  static readonly dependencies = () => [SqlResultTabsService, SqlExecutionPlanService] as const;
  static readonly make: Effect.Effect<
    SqlExecutionPlanResultBootstrapImpl,
    never,
    Context.Service.Identifier<typeof SqlResultTabsService> | Context.Service.Identifier<typeof SqlExecutionPlanService>
  > = Effect.gen(function* makeSqlExecutionPlanResultBootstrap() {
    const sqlResultTabsService = yield* SqlResultTabsService;
    const sqlExecutionPlanService = yield* SqlExecutionPlanService;

    return new SqlExecutionPlanResultBootstrapImpl(sqlResultTabsService, sqlExecutionPlanService);
  });
  static readonly layer: Layer.Layer<
    SqlExecutionPlanResultBootstrapDI,
    never,
    Context.Service.Identifier<typeof SqlResultTabsService> | Context.Service.Identifier<typeof SqlExecutionPlanService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlExecutionPlanResultBootstrap = SqlExecutionPlanResultBootstrapDI;
