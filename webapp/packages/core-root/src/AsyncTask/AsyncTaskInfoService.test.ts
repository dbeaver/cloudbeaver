/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { AsyncTaskInfo, GraphQLService } from '@cloudbeaver/core-sdk';

import { type ISessionEvent, ServerEventId, type SessionEventSource } from '../SessionEventSource.js';
import { AsyncTaskInfoEventHandler } from './AsyncTaskInfoEventHandler.js';
import { AsyncTaskInfoService } from './AsyncTaskInfoService.js';

describe('AsyncTaskInfoService', () => {
  let service: AsyncTaskInfoService;
  let events: Subject<ISessionEvent>;
  const getAsyncTaskInfo = vi.fn<GraphQLService['sdk']['getAsyncTaskInfo']>();
  const finished: AsyncTaskInfo = { id: 'query', running: false, taskResult: { updatedRows: 1 } };

  beforeEach(() => {
    vi.useFakeTimers();
    getAsyncTaskInfo.mockReset().mockResolvedValue({ taskInfo: finished });
    events = new Subject();
    const handler = new AsyncTaskInfoEventHandler({
      onInit: new SyncExecutor(),
      multiplex: () => events,
    } as unknown as SessionEventSource);

    service = new AsyncTaskInfoService({ sdk: { getAsyncTaskInfo } } as unknown as GraphQLService, handler);
  });

  afterEach(() => {
    service.dispose();
    events.complete();
    vi.useRealTimers();
  });

  it('continues sequential queries when the completion event is lost', async () => {
    for (let index = 0; index < 3; index++) {
      const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
      const completed = vi.fn();
      const result = service.run(task).then(completed);

      await vi.advanceTimersByTimeAsync(5000);

      expect(completed).toHaveBeenCalledWith(finished);
      await result;
      await service.remove(task.id);
    }
  });

  it('uses the completion event without waiting for polling', async () => {
    for (let index = 0; index < 3; index++) {
      const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
      const result = service.run(task);
      await vi.advanceTimersByTimeAsync(0);

      events.next({ id: ServerEventId.CbSessionTaskInfoUpdated, taskId: finished.id, running: false });

      await expect(result).resolves.toEqual(finished);
      await service.remove(task.id);
    }

    await vi.advanceTimersByTimeAsync(15000);
    expect(getAsyncTaskInfo).toHaveBeenCalledTimes(6);
  });

  it('handles completion before the initial GraphQL response', async () => {
    const task = service.create(() => {
      events.next({ id: ServerEventId.CbSessionTaskInfoUpdated, taskId: finished.id, running: false });
      return Promise.resolve({ id: finished.id, running: true });
    });

    const result = service.run(task);

    await vi.advanceTimersByTimeAsync(100);

    await expect(result).resolves.toEqual(finished);
    expect(getAsyncTaskInfo).toHaveBeenCalledTimes(1);
  });

  it('keeps waiting while the server reports that the task is running', async () => {
    getAsyncTaskInfo.mockResolvedValueOnce({ taskInfo: { id: finished.id, running: true } });
    const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
    const completed = vi.fn();
    const result = service.run(task).then(completed);

    await vi.advanceTimersByTimeAsync(5000);
    expect(completed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(completed).toHaveBeenCalledWith(finished);
    await result;
    await vi.advanceTimersByTimeAsync(15000);
    expect(getAsyncTaskInfo).toHaveBeenCalledTimes(2);
  });

  it('does not overlap slow status requests', async () => {
    let resolve!: (value: { taskInfo: AsyncTaskInfo }) => void;
    getAsyncTaskInfo.mockReturnValueOnce(
      new Promise(done => {
        resolve = done;
      }),
    );

    const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
    const result = service.run(task);

    await vi.advanceTimersByTimeAsync(15000);
    expect(getAsyncTaskInfo).toHaveBeenCalledTimes(1);

    resolve({ taskInfo: finished });
    await expect(result).resolves.toEqual(finished);
  });

  it('retries a failed status request without failing the SQL task', async () => {
    getAsyncTaskInfo.mockRejectedValueOnce(new Error('Network unavailable'));
    const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
    const completed = vi.fn();
    const result = service.run(task).then(completed);

    await vi.advanceTimersByTimeAsync(5000);
    expect(completed).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(5000);
    expect(completed).toHaveBeenCalledWith(finished);
    await result;
  });

  it('preserves server-side SQL errors recovered by polling', async () => {
    getAsyncTaskInfo.mockResolvedValueOnce({ taskInfo: { ...finished, error: { message: 'SQL execution failed' } } });
    const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
    const result = expect(service.run(task)).rejects.toThrow('SQL execution failed');

    await vi.advanceTimersByTimeAsync(5000);
    await result;
    await vi.advanceTimersByTimeAsync(15000);
    expect(getAsyncTaskInfo).toHaveBeenCalledTimes(1);
  });

  it('lets the completion event finish a task while polling is in flight', async () => {
    let resolve!: (value: { taskInfo: AsyncTaskInfo }) => void;
    getAsyncTaskInfo.mockReturnValueOnce(
      new Promise(done => {
        resolve = done;
      }),
    );

    const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
    const result = service.run(task);
    await vi.advanceTimersByTimeAsync(5000);

    events.next({ id: ServerEventId.CbSessionTaskInfoUpdated, taskId: finished.id, running: false });
    await expect(result).resolves.toEqual(finished);
    await service.remove(task.id);

    resolve({ taskInfo: { id: finished.id, running: true } });
    await vi.advanceTimersByTimeAsync(15000);

    expect(task.pending).toBe(false);
    expect(getAsyncTaskInfo).toHaveBeenCalledTimes(3);
  });

  it('stops polling when disposed', async () => {
    const task = service.create(() => Promise.resolve({ id: finished.id, running: true }));
    void service.run(task);
    await vi.advanceTimersByTimeAsync(0);

    service.dispose();
    await vi.advanceTimersByTimeAsync(15000);

    expect(getAsyncTaskInfo).not.toHaveBeenCalled();
  });
});
