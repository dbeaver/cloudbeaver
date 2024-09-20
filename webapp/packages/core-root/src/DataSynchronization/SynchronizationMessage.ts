/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { uuid } from '@cloudbeaver/core-utils';

import type { ISynchronizationMessage, ISynchronizationMessageResolveCallback } from './ISynchronizationMessage.js';

export class SynchronizationMessage implements ISynchronizationMessage {
  readonly id: string;
  readonly label: string;
  readonly message: string;
  readonly resolver: Promise<boolean>;

  private promiseResolve!: (state: boolean) => void;

  constructor(label: string, message: string) {
    this.id = uuid();
    this.label = label;
    this.message = message;

    this.resolver = new Promise(resolve => {
      this.promiseResolve = resolve;
    });
  }

  then(handler: ISynchronizationMessageResolveCallback): void {
    this.resolver.then(handler);
  }

  resolve(state: boolean): void {
    this.promiseResolve(state);
  }
}
