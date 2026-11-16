/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

import type { ISqlExecutionPlanViewProps } from './ISqlExecutionPlanViewProps.js';

export class SqlExecutionPlanViewServiceImpl {
  readonly tabs: TabsContainer<ISqlExecutionPlanViewProps>;

  constructor() {
    this.tabs = new TabsContainer('Execution Plan Views');
  }
}

export type SqlExecutionPlanViewService = SqlExecutionPlanViewServiceImpl;

export class SqlExecutionPlanViewServiceDI extends Context.Service<SqlExecutionPlanViewServiceDI, SqlExecutionPlanViewServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-execution-plan/SqlExecutionPlanViewService#SqlExecutionPlanViewService',
) {
  static readonly implementation = SqlExecutionPlanViewServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SqlExecutionPlanViewServiceImpl, never, never> = Effect.sync(() => new SqlExecutionPlanViewServiceImpl());
  static readonly layer: Layer.Layer<SqlExecutionPlanViewServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlExecutionPlanViewService = SqlExecutionPlanViewServiceDI;
