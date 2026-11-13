/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionExecutionContextService } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';

export class TransactionManagerServiceImpl {
  constructor(
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
  ) {}

  getActiveContextTransaction() {
    const context = this.connectionSchemaManagerService.activeExecutionContext;

    if (!context) {
      return;
    }

    return this.connectionExecutionContextService.get(context.id);
  }
}

export type TransactionManagerService = TransactionManagerServiceImpl;

export class TransactionManagerServiceDI extends Context.Service<TransactionManagerServiceDI, TransactionManagerServiceImpl>()(
  '@cloudbeaver/plugin-datasource-transaction-manager/TransactionManagerService#TransactionManagerService',
) {
  static readonly implementation = TransactionManagerServiceImpl;

  static readonly dependencies = () => [ConnectionSchemaManagerService, ConnectionExecutionContextService] as const;
  static readonly make: Effect.Effect<
    TransactionManagerServiceImpl,
    never,
    Context.Service.Identifier<typeof ConnectionSchemaManagerService> | Context.Service.Identifier<typeof ConnectionExecutionContextService>
  > = Effect.gen(function* makeTransactionManagerService() {
    const connectionSchemaManagerService = yield* ConnectionSchemaManagerService;
    const connectionExecutionContextService = yield* ConnectionExecutionContextService;

    return new TransactionManagerServiceImpl(connectionSchemaManagerService, connectionExecutionContextService);
  });
  static readonly layer: Layer.Layer<
    TransactionManagerServiceDI,
    never,
    Context.Service.Identifier<typeof ConnectionSchemaManagerService> | Context.Service.Identifier<typeof ConnectionExecutionContextService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TransactionManagerService = TransactionManagerServiceDI;
