/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type IScreen, ScreenService } from '@cloudbeaver/core-routing';

import { SqlEditorScreenSettingsService } from '../SqlEditorScreenSettingsService.js';
import type { ISqlEditorScreenParams } from './ISqlEditorScreenParams.js';
import { SqlEditorScreen } from './SqlEditorScreen.js';

export class SqlEditorScreenServiceImpl {
  readonly screen: IScreen<ISqlEditorScreenParams>;
  constructor(
    private readonly screenService: ScreenService,
    sqlEditorScreenSettingsService: SqlEditorScreenSettingsService,
  ) {
    this.screen = {
      name: 'sql-editor',
      routes: [{ name: 'sql-editor', path: '/sql-editor/:contextId' }],
      component: SqlEditorScreen,
      canDeActivate() {
        return sqlEditorScreenSettingsService.enabled;
      },
    };
  }

  createURL(params: ISqlEditorScreenParams): string {
    return this.screenService.buildUrl(this.screen.name, params);
  }

  navigate(params: ISqlEditorScreenParams): void {
    this.screenService.navigate(this.screen.name, params);
  }
}

export type SqlEditorScreenService = SqlEditorScreenServiceImpl;

export class SqlEditorScreenServiceDI extends Context.Service<SqlEditorScreenServiceDI, SqlEditorScreenServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-screen/Screen/SqlEditorScreenService#SqlEditorScreenService',
) {
  static readonly implementation = SqlEditorScreenServiceImpl;

  static readonly dependencies = () => [ScreenService, SqlEditorScreenSettingsService] as const;
  static readonly make: Effect.Effect<
    SqlEditorScreenServiceImpl,
    never,
    Context.Service.Identifier<typeof ScreenService> | Context.Service.Identifier<typeof SqlEditorScreenSettingsService>
  > = Effect.gen(function* makeSqlEditorScreenService() {
    const screenService = yield* ScreenService;
    const sqlEditorScreenSettingsService = yield* SqlEditorScreenSettingsService;

    return new SqlEditorScreenServiceImpl(screenService, sqlEditorScreenSettingsService);
  });
  static readonly layer: Layer.Layer<
    SqlEditorScreenServiceDI,
    never,
    Context.Service.Identifier<typeof ScreenService> | Context.Service.Identifier<typeof SqlEditorScreenSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorScreenService = SqlEditorScreenServiceDI;
