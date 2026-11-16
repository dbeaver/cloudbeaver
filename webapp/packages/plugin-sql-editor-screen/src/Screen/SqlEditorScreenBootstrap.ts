/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ScreenService } from '@cloudbeaver/core-routing';

import { SqlEditorScreenService } from './SqlEditorScreenService.js';

export class SqlEditorScreenBootstrapImpl extends Bootstrap {
  constructor(
    private readonly screenService: ScreenService,
    private readonly sqlEditorScreenService: SqlEditorScreenService,
  ) {
    super();
  }

  override register(): void {
    this.screenService.create(this.sqlEditorScreenService.screen);
  }
}

export type SqlEditorScreenBootstrap = SqlEditorScreenBootstrapImpl;

export class SqlEditorScreenBootstrapDI extends Context.Service<SqlEditorScreenBootstrapDI, SqlEditorScreenBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor-screen/Screen/SqlEditorScreenBootstrap#SqlEditorScreenBootstrap',
) {
  static readonly implementation = SqlEditorScreenBootstrapImpl;

  static readonly dependencies = () => [ScreenService, SqlEditorScreenService] as const;
  static readonly make: Effect.Effect<
    SqlEditorScreenBootstrapImpl,
    never,
    Context.Service.Identifier<typeof ScreenService> | Context.Service.Identifier<typeof SqlEditorScreenService>
  > = Effect.gen(function* makeSqlEditorScreenBootstrap() {
    const screenService = yield* ScreenService;
    const sqlEditorScreenService = yield* SqlEditorScreenService;

    return new SqlEditorScreenBootstrapImpl(screenService, sqlEditorScreenService);
  });
  static readonly layer: Layer.Layer<
    SqlEditorScreenBootstrapDI,
    never,
    Context.Service.Identifier<typeof ScreenService> | Context.Service.Identifier<typeof SqlEditorScreenService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorScreenBootstrap = SqlEditorScreenBootstrapDI;
