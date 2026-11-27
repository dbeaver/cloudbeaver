/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AsyncTaskInfo } from '@cloudbeaver/core-sdk';

import { AsyncTask } from './AsyncTask.js';

describe('AsyncTask status recovery', () => {
  const running: AsyncTaskInfo = { id: 'task-1', running: true };
  const finished: AsyncTaskInfo = { id: 'task-1', running: false, status: 'Finished' };
  let task: AsyncTask;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    task?.dispose();
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('recovers a completed task when no completion event arrives', async () => {
    const getInfo = vi.fn().mockResolvedValue(finished);
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();

    await vi.advanceTimersByTimeAsync(4999);
    expect(getInfo).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(getInfo).toHaveBeenCalledTimes(1);
    await expect(task.promise).resolves.toEqual(finished);
    expect(getInfo).toHaveBeenCalledWith(running.id);
    await vi.advanceTimersByTimeAsync(15000);
    expect(getInfo).toHaveBeenCalledTimes(1);
  });

  it('does not poll tasks that complete in the initial response', async () => {
    const getInfo = vi.fn();
    task = new AsyncTask(() => Promise.resolve(finished), vi.fn(), getInfo);
    await task.run();
    await vi.advanceTimersByTimeAsync(15000);

    await expect(task.promise).resolves.toEqual(finished);
    expect(getInfo).not.toHaveBeenCalled();
  });

  it('keeps event-driven completion immediate and cancels the fallback', async () => {
    const getInfo = vi.fn();
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();
    await vi.advanceTimersByTimeAsync(1000);
    await task.updateInfoAsync(() => Promise.resolve(finished));

    await expect(task.promise).resolves.toEqual(finished);
    await vi.advanceTimersByTimeAsync(15000);
    expect(getInfo).not.toHaveBeenCalled();
  });

  it('does not overlap slow status requests and keeps polling running tasks', async () => {
    let resolveInfo!: (info: AsyncTaskInfo) => void;
    const getInfo = vi
      .fn()
      .mockImplementationOnce(() => new Promise<AsyncTaskInfo>(resolve => (resolveInfo = resolve)))
      .mockResolvedValue(finished);

    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();
    await vi.advanceTimersByTimeAsync(20000);
    expect(getInfo).toHaveBeenCalledTimes(1);

    resolveInfo(running);
    await vi.advanceTimersByTimeAsync(5000);
    await expect(task.promise).resolves.toEqual(finished);
    expect(getInfo).toHaveBeenCalledTimes(2);
  });

  it('retries after a temporary status request failure', async () => {
    const error = new Error('Network unavailable');
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const getInfo = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(finished);
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();
    await vi.advanceTimersByTimeAsync(5000);
    expect(log).toHaveBeenCalledWith('Failed to refresh async task status', error);
    expect(task.info?.running).toBe(true);

    await vi.advanceTimersByTimeAsync(5000);
    await expect(task.promise).resolves.toEqual(finished);
  });

  it('preserves a completion event received during a status request', async () => {
    let resolveInfo!: (info: AsyncTaskInfo) => void;
    const getInfo = vi.fn(() => new Promise<AsyncTaskInfo>(resolve => (resolveInfo = resolve)));
    const eventInfo = vi.fn().mockResolvedValue(finished);
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();
    await vi.advanceTimersByTimeAsync(5000);
    await task.updateInfoAsync(eventInfo);
    expect(eventInfo).not.toHaveBeenCalled();

    resolveInfo(running);
    await vi.advanceTimersByTimeAsync(100);
    await expect(task.promise).resolves.toEqual(finished);
    await vi.advanceTimersByTimeAsync(10000);
    expect(eventInfo).toHaveBeenCalledTimes(1);
    expect(getInfo).toHaveBeenCalledTimes(1);
  });

  it('reports server task errors discovered by polling', async () => {
    const getInfo = vi.fn().mockResolvedValue({ ...finished, error: { message: 'Query failed' } });
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    const result = task.promise.catch(error => error);
    await task.run();
    await vi.advanceTimersByTimeAsync(5000);

    expect(await result).toBeInstanceOf(Error);
    expect((await result).message).toContain('Query failed');
    await vi.advanceTimersByTimeAsync(10000);
    expect(getInfo).toHaveBeenCalledTimes(1);
  });

  it('recovers cancellation completion even if its event is missed', async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const getInfo = vi.fn().mockResolvedValue(finished);
    task = new AsyncTask(() => Promise.resolve(running), cancel, getInfo);
    await task.run();
    await task.cancelAsync();
    await vi.advanceTimersByTimeAsync(5000);

    expect(cancel).toHaveBeenCalledWith(running.id);
    await expect(task.promise).resolves.toEqual(finished);
  });

  it('stops polling when disposed during an in-flight request', async () => {
    let resolveInfo!: (info: AsyncTaskInfo) => void;
    const getInfo = vi.fn(() => new Promise<AsyncTaskInfo>(resolve => (resolveInfo = resolve)));
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();
    await vi.advanceTimersByTimeAsync(5000);
    task.dispose();
    resolveInfo(running);
    await vi.advanceTimersByTimeAsync(15000);

    expect(getInfo).toHaveBeenCalledTimes(1);
  });

  it('cancels a scheduled status check on disposal', async () => {
    const getInfo = vi.fn();
    task = new AsyncTask(() => Promise.resolve(running), vi.fn(), getInfo);
    await task.run();
    task.dispose();
    await vi.advanceTimersByTimeAsync(10000);

    expect(getInfo).not.toHaveBeenCalled();
  });
});
