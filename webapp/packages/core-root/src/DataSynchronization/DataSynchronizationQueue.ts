/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISynchronizationMessage, ISynchronizationMessageResolveCallback } from './ISynchronizationMessage.js';

export class DataSynchronizationQueue {
  private readonly onResolve: ISynchronizationMessageResolveCallback;

  private readonly queue: Map<string, ISynchronizationMessage>;
  constructor(onResolve: ISynchronizationMessageResolveCallback) {
    this.onResolve = onResolve;
    this.queue = new Map();
  }

  add(message: ISynchronizationMessage) {
    message.then(this.resolve.bind(this, message.id));
    this.queue.set(message.id, message);
  }

  private resolve(id: string, state: boolean) {
    this.queue.delete(id);

    if (this.queue.size === 0) {
      this.onResolve(state);
    }
  }
}
