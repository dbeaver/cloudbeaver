/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { ClientActivityService, INACTIVE_PERIOD_TIME } from './ClientActivityService.js';

jest.useFakeTimers();

describe('ClientActivityService', () => {
  let clientActivityService: ClientActivityService;

  beforeEach(() => {
    clientActivityService = new ClientActivityService();

    jest.spyOn(global, 'setTimeout');
    jest.spyOn(global, 'clearTimeout');
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
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

    jest.advanceTimersByTime(INACTIVE_PERIOD_TIME);

    expect(clientActivityService.isActive).toBe(false);
  });

  it('should clear previous timer if updateActivity is called multiple times', () => {
    clientActivityService.updateActivity();
    expect(setTimeout).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(Math.random() * INACTIVE_PERIOD_TIME - 1);

    clientActivityService.updateActivity();
    expect(clearTimeout).toHaveBeenCalledTimes(1);
    expect(setTimeout).toHaveBeenCalledTimes(2);
  });

  it('should clear timer and reset activity when resetActivity is called', () => {
    clientActivityService.updateActivity();

    jest.advanceTimersByTime(Math.random() * INACTIVE_PERIOD_TIME - 1);

    clientActivityService.resetActivity();

    expect(clientActivityService.isActive).toBe(false);
    expect(clearTimeout).toHaveBeenCalled();
  });

  it('should call onActiveStateChange executor with correct value', () => {
    const onActiveStateChangeSpy = jest.spyOn(clientActivityService.onActiveStateChange, 'execute');

    clientActivityService.updateActivity();
    expect(onActiveStateChangeSpy).toHaveBeenCalledWith(true);

    jest.advanceTimersByTime(INACTIVE_PERIOD_TIME);
    expect(onActiveStateChangeSpy).toHaveBeenCalledWith(false);
  });
});
