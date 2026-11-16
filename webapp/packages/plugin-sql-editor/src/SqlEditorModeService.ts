/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { TabsContainer } from '@cloudbeaver/core-ui';

import type { ISqlEditorTabState } from './ISqlEditorTabState.js';
import type { ISQLEditorData } from './SqlEditor/ISQLEditorData.js';

export interface ISqlEditorModeProps {
  state: ISqlEditorTabState;
  data: ISQLEditorData;
}

export class SqlEditorModeServiceImpl {
  readonly tabsContainer: TabsContainer<ISqlEditorModeProps>;

  constructor() {
    this.tabsContainer = new TabsContainer('SQL Editor Mode');
  }
}

export type SqlEditorModeService = SqlEditorModeServiceImpl;

export class SqlEditorModeServiceDI extends Context.Service<SqlEditorModeServiceDI, SqlEditorModeServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlEditorModeService#SqlEditorModeService',
) {
  static readonly implementation = SqlEditorModeServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<SqlEditorModeServiceImpl, never, never> = Effect.sync(() => new SqlEditorModeServiceImpl());
  static readonly layer: Layer.Layer<SqlEditorModeServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorModeService = SqlEditorModeServiceDI;
