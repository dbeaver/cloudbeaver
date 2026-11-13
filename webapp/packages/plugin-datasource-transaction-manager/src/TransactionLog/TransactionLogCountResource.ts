/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { toJS } from 'mobx';

import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CachedMapResource } from '@cloudbeaver/core-resource';
import { ServerEventId } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { schemaValidationError } from '@cloudbeaver/core-utils';

import { createTransactionInfoParam, type ITransactionInfoParam, TRANSACTION_INFO_PARAM_SCHEMA } from './TRANSACTION_INFO_PARAM_SCHEMA.js';
import { type IWsTransactionCountEvent, TransactionLogCountEventHandler } from './TransactionLogCountEventHandler.js';

export class TransactionLogCountResourceImpl extends CachedMapResource<ITransactionInfoParam, number> {
  constructor(
    private readonly graphQLService: GraphQLService,
    transactionLogCountEventHandler: TransactionLogCountEventHandler,
  ) {
    super();

    transactionLogCountEventHandler.onEvent<IWsTransactionCountEvent>(
      ServerEventId.CbTransactionCount,
      async data => {
        const key = createTransactionInfoParam(data.connectionId, data.projectId, data.contextId);
        this.set(key, data.transactionalCount);
      },
      undefined,
      this,
    );
  }

  protected async loader(key: ITransactionInfoParam) {
    const { info } = await this.graphQLService.sdk.getTransactionCount({
      connectionId: key.connectionId,
      projectId: key.projectId,
      contextId: key.contextId,
    });

    this.set(key, info.count);

    return this.data;
  }

  override isKeyEqual(key: ITransactionInfoParam, secondKey: ITransactionInfoParam): boolean {
    return key.connectionId === secondKey.connectionId && key.projectId === secondKey.projectId;
  }

  protected override validateKey(key: ITransactionInfoParam): boolean {
    const parse = TRANSACTION_INFO_PARAM_SCHEMA.safeParse(toJS(key));

    if (!parse.success) {
      this.logger.warn(`Invalid resource key ${(schemaValidationError(parse.error).toString(), { prefix: null })}`);
    }

    return parse.success;
  }
}

export type TransactionLogCountResource = TransactionLogCountResourceImpl;

export class TransactionLogCountResourceDI extends Context.Service<TransactionLogCountResourceDI, TransactionLogCountResourceImpl>()(
  '@cloudbeaver/plugin-datasource-transaction-manager/TransactionLog/TransactionLogCountResource#TransactionLogCountResource',
) {
  static readonly implementation = TransactionLogCountResourceImpl;

  static readonly dependencies = () => [GraphQLService, TransactionLogCountEventHandler] as const;
  static readonly make: Effect.Effect<
    TransactionLogCountResourceImpl,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof TransactionLogCountEventHandler>
  > = Effect.gen(function* makeTransactionLogCountResource() {
    const graphQLService = yield* GraphQLService;
    const transactionLogCountEventHandler = yield* TransactionLogCountEventHandler;

    return new TransactionLogCountResourceImpl(graphQLService, transactionLogCountEventHandler);
  });
  static readonly layer: Layer.Layer<
    TransactionLogCountResourceDI,
    never,
    Context.Service.Identifier<typeof GraphQLService> | Context.Service.Identifier<typeof TransactionLogCountEventHandler>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TransactionLogCountResource = TransactionLogCountResourceDI;
