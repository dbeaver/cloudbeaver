/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AutoRunningTask } from './TaskScheduler/AutoRunningTask.js';
import { CancelError } from './TaskScheduler/CancelError.js';
import type { ITask } from './TaskScheduler/ITask.js';
import { Task } from './TaskScheduler/Task.js';
import { TimeoutError } from './TaskScheduler/TimeoutError.js';

export function whileTask<T>(
  callback: (value: T) => Promise<boolean> | boolean,
  task: () => Promise<T>,
  interval: number,
  cancelMessage?: string,
  timeout?: number,
): ITask<T> {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;
  let fulfilled = false;

  let intervalTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let activeTask: Promise<T> | null = null;
  let stopped = false;

  const lockPromise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  }).finally(() => {
    if (intervalTimeoutId !== null) {
      clearTimeout(intervalTimeoutId);
    }

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    fulfilled = true;
  });

  function stop() {
    if (intervalTimeoutId !== null) {
      clearTimeout(intervalTimeoutId);
    }
    stopped = true;
  }

  async function cancelTask(exception?: any) {
    if (fulfilled) {
      return;
    }

    stop();

    if (activeTask instanceof Task) {
      await activeTask.cancel();
    }

    reject(exception);
  }

  if (timeout !== undefined) {
    timeoutId = setTimeout(() => cancelTask(new TimeoutError('Task timeout exceeded')), timeout);
  }

  function runTask() {
    activeTask = task();
    activeTask
      .finally(() => {
        activeTask = null;
      })
      .then(async value => {
        const state = await callback(value);

        if (state) {
          resolve(value);
        } else if (!stopped) {
          intervalTimeoutId = setTimeout(runTask, interval);
        }
      })
      .catch(cancelTask);
  }

  return new AutoRunningTask(
    () => {
      runTask();
      return lockPromise;
    },
    () => cancelTask(new CancelError(cancelMessage ?? 'Task was cancelled')),
  );
}
