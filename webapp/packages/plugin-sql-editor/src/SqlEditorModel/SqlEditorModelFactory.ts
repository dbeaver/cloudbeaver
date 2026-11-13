/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import type { QueryDataSource } from '../QueryDataSource.js';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService.js';
import { SqlEditorService } from '../SqlEditorService.js';
import { SqlEditorSettingsService } from '../SqlEditorSettingsService.js';
import { SqlEditorModel } from './SqlEditorModel.js';

export class SqlEditorModelFactory extends Context.Service<SqlEditorModelFactory>()('@cloudbeaver/plugin-sql-editor/SqlEditorModelFactory', {
  make: Effect.gen(function* makeSqlEditorModelFactory() {
    const sqlDataSourceService = yield* SqlDataSourceService;
    const sqlEditorService = yield* SqlEditorService;
    const notificationService = yield* NotificationService;
    const sqlEditorSettingsService = yield* SqlEditorSettingsService;

    return {
      create: <TDataSource extends QueryDataSource>() =>
        new SqlEditorModel<TDataSource>(sqlDataSourceService, sqlEditorService, notificationService, sqlEditorSettingsService),
    };
  }),
}) {
  static readonly dependencies = () => [SqlDataSourceService, SqlEditorService, NotificationService, SqlEditorSettingsService] as const;
  static readonly layer = Layer.effect(this, this.make);
}
