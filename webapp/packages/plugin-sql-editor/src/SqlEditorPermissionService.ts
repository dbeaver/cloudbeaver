/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource, EConnectionFeature, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';

export class SqlEditorPermissionServiceImpl {
  constructor(
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
  ) {}

  isScriptExecutionEnabled(connectionKey: IConnectionInfoParams): boolean {
    const connection = this.connectionInfoResource.get(connectionKey);

    if (!connection) {
      return false;
    }

    return !connection.features.includes(EConnectionFeature.restrictScriptExecute) && this.sqlEditorSettingsService.scriptExecutionEnabled;
  }
}

export type SqlEditorPermissionService = SqlEditorPermissionServiceImpl;

export class SqlEditorPermissionServiceDI extends Context.Service<SqlEditorPermissionServiceDI, SqlEditorPermissionServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlEditorPermissionService#SqlEditorPermissionService',
) {
  static readonly implementation = SqlEditorPermissionServiceImpl;

  static readonly dependencies = () => [ConnectionInfoResource, SqlEditorSettingsService] as const;
  static readonly make: Effect.Effect<
    SqlEditorPermissionServiceImpl,
    never,
    Context.Service.Identifier<typeof ConnectionInfoResource> | Context.Service.Identifier<typeof SqlEditorSettingsService>
  > = Effect.gen(function* makeSqlEditorPermissionService() {
    const connectionInfoResource = yield* ConnectionInfoResource;
    const sqlEditorSettingsService = yield* SqlEditorSettingsService;

    return new SqlEditorPermissionServiceImpl(connectionInfoResource, sqlEditorSettingsService);
  });
  static readonly layer: Layer.Layer<
    SqlEditorPermissionServiceDI,
    never,
    Context.Service.Identifier<typeof ConnectionInfoResource> | Context.Service.Identifier<typeof SqlEditorSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorPermissionService = SqlEditorPermissionServiceDI;
