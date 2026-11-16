/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { ResourceSqlDataSource } from './ResourceSqlDataSource.js';

export class SqlEditorTabResourceServiceImpl {
  constructor(
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlDataSourceService: SqlDataSourceService,
  ) {}

  getResourceTab(key: string) {
    const dataSource = this.sqlDataSourceService.dataSources.find(
      ([, dataSource]) => dataSource instanceof ResourceSqlDataSource && dataSource.resourceKey === key,
    );

    const tab = this.sqlEditorTabService.sqlEditorTabs.find(tab => dataSource && tab.handlerState.editorId === dataSource[0]);

    return tab;
  }
}

export type SqlEditorTabResourceService = SqlEditorTabResourceServiceImpl;

export class SqlEditorTabResourceServiceDI extends Context.Service<SqlEditorTabResourceServiceDI, SqlEditorTabResourceServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-navigation-tab-script/SqlEditorTabResourceService#SqlEditorTabResourceService',
) {
  static readonly implementation = SqlEditorTabResourceServiceImpl;

  static readonly dependencies = () => [SqlEditorTabService, SqlDataSourceService] as const;
  static readonly make: Effect.Effect<
    SqlEditorTabResourceServiceImpl,
    never,
    Context.Service.Identifier<typeof SqlEditorTabService> | Context.Service.Identifier<typeof SqlDataSourceService>
  > = Effect.gen(function* makeSqlEditorTabResourceService() {
    const sqlEditorTabService = yield* SqlEditorTabService;
    const sqlDataSourceService = yield* SqlDataSourceService;

    return new SqlEditorTabResourceServiceImpl(sqlEditorTabService, sqlDataSourceService);
  });
  static readonly layer: Layer.Layer<
    SqlEditorTabResourceServiceDI,
    never,
    Context.Service.Identifier<typeof SqlEditorTabService> | Context.Service.Identifier<typeof SqlDataSourceService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorTabResourceService = SqlEditorTabResourceServiceDI;
