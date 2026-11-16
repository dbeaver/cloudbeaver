/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISessionEvent, type SessionEventId, SessionEventSource, SessionEventTopic, TopicEventHandler } from '@cloudbeaver/core-root';
import type { WsTransactionalCountEvent } from '@cloudbeaver/core-sdk';

export type IWsTransactionCountEvent = WsTransactionalCountEvent;

type TransactionCountEvent = IWsTransactionCountEvent;

export class TransactionLogCountEventHandlerImpl extends TopicEventHandler<TransactionCountEvent, ISessionEvent, SessionEventId, SessionEventTopic> {
  constructor(sessionEventSource: SessionEventSource) {
    super(SessionEventTopic.CbTransaction, sessionEventSource);
  }

  map(event: any): TransactionCountEvent {
    return event;
  }
}

export type TransactionLogCountEventHandler = TransactionLogCountEventHandlerImpl;

export class TransactionLogCountEventHandlerDI extends Context.Service<TransactionLogCountEventHandlerDI, TransactionLogCountEventHandlerImpl>()(
  '@cloudbeaver/plugin-datasource-transaction-manager/TransactionLog/TransactionLogCountEventHandler#TransactionLogCountEventHandler',
) {
  static readonly implementation = TransactionLogCountEventHandlerImpl;

  static readonly dependencies = () => [SessionEventSource] as const;
  static readonly make: Effect.Effect<TransactionLogCountEventHandlerImpl, never, Context.Service.Identifier<typeof SessionEventSource>> = Effect.gen(
    function* makeTransactionLogCountEventHandler() {
      const sessionEventSource = yield* SessionEventSource;

      return new TransactionLogCountEventHandlerImpl(sessionEventSource);
    },
  );
  static readonly layer: Layer.Layer<TransactionLogCountEventHandlerDI, never, Context.Service.Identifier<typeof SessionEventSource>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const TransactionLogCountEventHandler = TransactionLogCountEventHandlerDI;
