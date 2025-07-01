/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, vitest, afterEach } from 'vitest';

import { ClientActivityService, INACTIVE_PERIOD_TIME } from './ClientActivityService.js';

vitest.mock('@cloudbeaver/core-executor', () => ({
  Executor: vitest.fn(() => ({
    execute: vitest.fn(),
    addHandler: vitest.fn(),
    removeHandler: vitest.fn(),
    addPostHandler: vitest.fn(),
    removePostHandler: vitest.fn(),
    before: vitest.fn(),
    removeBefore: vitest.fn(),
    next: vitest.fn(),
  })),
}));

describe('ClientActivityService', () => {
  let clientActivityService: ClientActivityService;

  beforeEach(() => {
    vitest.useFakeTimers();
    clientActivityService = new ClientActivityService();
  });

  afterEach(() => {
    vitest.useRealTimers();
  });

  it('should initialize with isActive set to false', () => {
    expect(clientActivityService.isActive).toBe(false);
  });

  it('should set isActive to true when updateActivity is called', () => {
    clientActivityService.updateActivity();
    expect(clientActivityService.isActive).toBe(true);
  });

  it('should reset activity after the timeout period', () => {
    clientActivityService.updateActivity();
    expect(clientActivityService.isActive).toBe(true);

    vitest.advanceTimersByTime(INACTIVE_PERIOD_TIME);

    expect(clientActivityService.isActive).toBe(false);
  });

  it('should clear previous timer if updateActivity is called multiple times', () => {
    clientActivityService.updateActivity();
    expect(clientActivityService.isActive).toBe(true);

    vitest.advanceTimersByTime(INACTIVE_PERIOD_TIME - 10);

    clientActivityService.updateActivity();
    expect(clientActivityService.isActive).toBe(true);

    vitest.advanceTimersByTime(INACTIVE_PERIOD_TIME);

    expect(clientActivityService.isActive).toBe(false);
  });

  it('should clear timer and reset activity when resetActivity is called', () => {
    clientActivityService.updateActivity();

    vitest.advanceTimersByTime(INACTIVE_PERIOD_TIME - 10);

    clientActivityService.resetActivity();

    expect(clientActivityService.isActive).toBe(false);

    vitest.advanceTimersByTime(INACTIVE_PERIOD_TIME);

    expect(clientActivityService.isActive).toBe(false);
  });

  it('should call onActiveStateChange executor with correct value', () => {
    const onActiveStateChangeSpy = vitest.spyOn(clientActivityService.onActiveStateChange, 'execute');

    clientActivityService.updateActivity();
    expect(onActiveStateChangeSpy).toHaveBeenCalledWith(true);

    vitest.advanceTimersByTime(INACTIVE_PERIOD_TIME);
    expect(onActiveStateChangeSpy).toHaveBeenCalledWith(false);
  });
});
