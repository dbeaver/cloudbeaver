/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionDialectResource, type IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

export class SqlDialectInfoServiceImpl {
  constructor(
    private readonly connectionDialectResource: ConnectionDialectResource,
    private readonly notificationService: NotificationService,
  ) {}

  async formatScript(context: IConnectionExecutionContextInfo, query: string): Promise<string> {
    try {
      return await this.connectionDialectResource.formatScript(context, query);
    } catch (error: any) {
      this.notificationService.logException(error, 'Failed to format script');
    }

    return query;
  }
}

export type SqlDialectInfoService = SqlDialectInfoServiceImpl;

export class SqlDialectInfoServiceDI extends Context.Service<SqlDialectInfoServiceDI, SqlDialectInfoServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlDialectInfoService#SqlDialectInfoService',
) {
  static readonly implementation = SqlDialectInfoServiceImpl;

  static readonly dependencies = () => [ConnectionDialectResource, NotificationService] as const;
  static readonly make: Effect.Effect<
    SqlDialectInfoServiceImpl,
    never,
    Context.Service.Identifier<typeof ConnectionDialectResource> | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeSqlDialectInfoService() {
    const connectionDialectResource = yield* ConnectionDialectResource;
    const notificationService = yield* NotificationService;

    return new SqlDialectInfoServiceImpl(connectionDialectResource, notificationService);
  });
  static readonly layer: Layer.Layer<
    SqlDialectInfoServiceDI,
    never,
    Context.Service.Identifier<typeof ConnectionDialectResource> | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlDialectInfoService = SqlDialectInfoServiceDI;
