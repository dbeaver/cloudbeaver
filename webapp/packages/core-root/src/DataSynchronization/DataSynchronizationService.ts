/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { ISynchronizationMessage, ISynchronizationMessageResolveCallback } from './ISynchronizationMessage.js';
import { SynchronizationMessage } from './SynchronizationMessage.js';

export class DataSynchronizationServiceImpl {
  readonly queue: Map<string, ISynchronizationMessage>;
  readonly onSynchronizationRequest: ISyncExecutor;

  constructor() {
    this.onSynchronizationRequest = new SyncExecutor();
    this.queue = new Map();

    makeObservable(this, {
      queue: observable.shallow,
    });
  }

  requestSynchronization(label: string, message: string, onResolve?: ISynchronizationMessageResolveCallback): ISynchronizationMessage {
    const synchronizationMessage = new SynchronizationMessage(label, message);

    if (onResolve) {
      synchronizationMessage.then(onResolve);
    }

    this.queue.set(synchronizationMessage.id, synchronizationMessage);

    if (this.onSynchronizationRequest.handlers.length === 0) {
      this.resolve(synchronizationMessage.id, true);
      console.warn('DataSynchronizationService: request resolved automatically');
    } else {
      this.onSynchronizationRequest.execute();
    }

    return synchronizationMessage;
  }

  resolve(id: string, state: boolean) {
    const synchronizationMessage = this.queue.get(id);

    if (synchronizationMessage) {
      this.queue.delete(id);
      synchronizationMessage.resolve(state);
    }
  }

  resolveAll(state: boolean) {
    const messages = Array.from(this.queue.values());

    for (const message of messages) {
      this.queue.delete(message.id);
      message.resolve(state);
    }
  }
}

export type DataSynchronizationService = DataSynchronizationServiceImpl;

export class DataSynchronizationServiceDI extends Context.Service<DataSynchronizationServiceDI, DataSynchronizationServiceImpl>()(
  '@cloudbeaver/core-root/DataSynchronization/DataSynchronizationService#DataSynchronizationService',
) {
  static readonly implementation = DataSynchronizationServiceImpl;

  static readonly dependencies = () => [] as const;
  static readonly make: Effect.Effect<DataSynchronizationServiceImpl, never, never> = Effect.sync(() => new DataSynchronizationServiceImpl());
  static readonly layer: Layer.Layer<DataSynchronizationServiceDI, never, never> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataSynchronizationService = DataSynchronizationServiceDI;
