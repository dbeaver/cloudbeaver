/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { Deferred, EDeferredState } from './Deferred.js';
import type { PromiseExecutor } from './PromiseExecutor.js';

jest.mock('./PromiseExecutor', () => ({
  PromiseExecutor: jest.fn().mockImplementation(() => ({
    promise: new Promise((resolve, reject) => {
      Object.defineProperty(this, 'resolve', { value: resolve });
      Object.defineProperty(this, 'reject', { value: reject });
    }),
    resolve: jest.fn(),
    reject: jest.fn(),
  })),
}));

describe('Deferred', () => {
  let deferred: Deferred<string>;
  let mockPromiseExecutor: jest.Mocked<PromiseExecutor<string>>;

  beforeEach(() => {
    jest.clearAllMocks();
    deferred = new Deferred<string>();
    mockPromiseExecutor = (deferred as any).promiseExecutor;
  });

  describe('Initial State', () => {
    it('should initialize with PENDING state', () => {
      expect(deferred.getState()).toBe(EDeferredState.PENDING);
    });

    it('should have undefined payload initially', () => {
      expect(deferred.getPayload()).toBeUndefined();
    });

    it('should have undefined rejection reason initially', () => {
      expect(deferred.getRejectionReason()).toBeUndefined();
    });

    it('should be in progress initially', () => {
      expect(deferred.isInProgress).toBe(true);
    });

    it('should not be finished initially', () => {
      expect(deferred.isFinished).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('should transition to RESOLVED state', () => {
      const value = 'test value';
      deferred['toResolved'](value);

      expect(deferred.getState()).toBe(EDeferredState.RESOLVED);
      expect(deferred.getPayload()).toBe(value);
      expect(deferred.isInProgress).toBe(false);
      expect(deferred.isFinished).toBe(true);
      expect(mockPromiseExecutor.resolve).toHaveBeenCalledWith(value);
    });

    it('should transition to REJECTED state', () => {
      const error = new Error('test error');
      deferred['toRejected'](error);

      expect(deferred.getState()).toBe(EDeferredState.REJECTED);
      expect(deferred.getRejectionReason()).toBe(error);
      expect(deferred.isInProgress).toBe(false);
      expect(deferred.isFinished).toBe(true);
      expect(mockPromiseExecutor.reject).toHaveBeenCalledWith(error);
    });

    it('should transition to CANCELLED state', () => {
      const reason = 'cancelled reason';
      deferred['toCancelled'](reason);

      expect(deferred.getState()).toBe(EDeferredState.CANCELLED);
      expect(deferred.getRejectionReason()).toBe(reason);
      expect(deferred.isInProgress).toBe(false);
      expect(deferred.isFinished).toBe(true);
      expect(mockPromiseExecutor.reject).toHaveBeenCalledWith(reason);
    });

    it('should transition to CANCELLING state from PENDING', () => {
      deferred['toCancelling']();

      expect(deferred.getState()).toBe(EDeferredState.CANCELLING);
      expect(deferred.isInProgress).toBe(true);
      expect(deferred.isFinished).toBe(false);
    });

    it('should transition back to PENDING from CANCELLING', () => {
      deferred['toCancelling']();
      deferred['toPending']();

      expect(deferred.getState()).toBe(EDeferredState.PENDING);
      expect(deferred.isInProgress).toBe(true);
      expect(deferred.isFinished).toBe(false);
    });

    it('should not transition to PENDING from non-CANCELLING state', () => {
      deferred['toResolved']('test');
      deferred['toPending']();

      expect(deferred.getState()).toBe(EDeferredState.RESOLVED);
    });
  });

  describe('Promise Behavior', () => {
    it('should return promise from PromiseExecutor', () => {
      expect(deferred.promise).toBe(mockPromiseExecutor.promise);
    });

    it('should call PromiseExecutor.resolve when transitioning to RESOLVED', () => {
      const value = 'test value';
      deferred['toResolved'](value);
      expect(mockPromiseExecutor.resolve).toHaveBeenCalledWith(value);
    });

    it('should call PromiseExecutor.reject when transitioning to REJECTED', () => {
      const error = new Error('test error');
      deferred['toRejected'](error);
      expect(mockPromiseExecutor.reject).toHaveBeenCalledWith(error);
    });

    it('should call PromiseExecutor.reject when transitioning to CANCELLED', () => {
      const reason = 'cancelled reason';
      deferred['toCancelled'](reason);
      expect(mockPromiseExecutor.reject).toHaveBeenCalledWith(reason);
    });
  });

  describe('getPayload', () => {
    it('should return undefined for non-resolved state without default value', () => {
      expect(deferred.getPayload()).toBeUndefined();
    });

    it('should return default value for non-resolved state when provided', () => {
      const defaultValue = 'default';
      expect(deferred.getPayload(defaultValue)).toBe(defaultValue);
    });

    it('should return actual value when resolved regardless of default value', () => {
      const value = 'actual';
      const defaultValue = 'default';

      deferred['toResolved'](value);

      expect(deferred.getPayload(defaultValue)).toBe(value);
    });
  });
});
