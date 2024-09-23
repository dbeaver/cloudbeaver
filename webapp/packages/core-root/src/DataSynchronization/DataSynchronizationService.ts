/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

import type { ISynchronizationMessage, ISynchronizationMessageResolveCallback } from './ISynchronizationMessage.js';
import { SynchronizationMessage } from './SynchronizationMessage.js';

@injectable()
export class DataSynchronizationService {
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
