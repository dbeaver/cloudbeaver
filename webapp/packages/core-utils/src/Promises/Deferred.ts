/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { PromiseExecutor } from './PromiseExecutor.js';

export enum EDeferredState {
  'PENDING' = 'PENDING',
  'RESOLVED' = 'RESOLVED',
  'REJECTED' = 'REJECTED',
  'CANCELLING' = 'CANCELLING',
  'CANCELLED' = 'CANCELLED',
}

/**
 * Wrapper for promise to use with mobx to control state of a promise
 */
export class Deferred<T> {
  private payload: T | undefined;
  private rejectionReason: any;
  private state: EDeferredState = EDeferredState.PENDING;

  private readonly promiseExecutor = new PromiseExecutor<T>();

  constructor() {
    this.payload = undefined;
    this.rejectionReason = undefined;

    makeObservable<Deferred<T>, 'payload' | 'rejectionReason' | 'state' | 'toResolved' | 'toRejected' | 'toCancelled' | 'toCancelling' | 'toPending'>(
      this,
      {
        payload: observable,
        rejectionReason: observable,
        state: observable,
        isInProgress: computed,
        isFinished: computed,
        toResolved: action,
        toRejected: action,
        toCancelled: action,
        toCancelling: action,
        toPending: action,
      },
    );
  }

  get promise(): Promise<T> {
    return this.promiseExecutor.promise;
  }

  get isInProgress() {
    return this.state === EDeferredState.PENDING || this.state === EDeferredState.CANCELLING;
  }

  get isFinished() {
    return !this.isInProgress;
  }

  getPayload(defaultValue: T): T;
  getPayload(): T | undefined;
  getPayload(defaultValue?: T): T | undefined {
    if (this.state === EDeferredState.RESOLVED) {
      return this.payload;
    }
    return defaultValue;
  }

  getState() {
    return this.state;
  }

  getRejectionReason() {
    return this.rejectionReason;
  }

  cancel() {}

  protected toResolved(value: T): void {
    this.state = EDeferredState.RESOLVED;
    this.payload = value;
    this.promiseExecutor.resolve(value);
  }

  protected toRejected(reason?: any): void {
    this.state = EDeferredState.REJECTED;
    this.rejectionReason = reason;
    this.promiseExecutor.reject(reason);
  }

  protected toCancelled(reason?: any): void {
    this.state = EDeferredState.CANCELLED;
    this.rejectionReason = reason;
    this.promiseExecutor.reject(reason);
  }

  protected toCancelling(): void {
    if (this.state === EDeferredState.PENDING) {
      this.state = EDeferredState.CANCELLING;
    }
  }

  protected toPending(): void {
    if (this.state === EDeferredState.CANCELLING) {
      this.state = EDeferredState.PENDING;
    }
  }
}
