/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AutoRunningTask } from './TaskScheduler/AutoRunningTask';
import type { ITask } from './TaskScheduler/ITask';
import { Task } from './TaskScheduler/Task';

export function whileTask<T>(
  callback: (value: T) => Promise<boolean> | boolean,
  task: () => Promise<T>,
  interval: number,
  cancelMessage?: string,
): ITask<T> {
  let resolve: (value: T | PromiseLike<T>) => void;
  let reject: (reason?: any) => void;

  const lockPromise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  let timeoutId: NodeJS.Timeout | null;
  let activeTask: Promise<T> | null;
  let stopped = false;

  function stop() {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    stopped = true;
  }

  async function cancelTask(exception?: any) {
    stop();

    if (activeTask instanceof Task) {
      await activeTask.cancel();
    }

    reject(exception);
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
          timeoutId = setTimeout(runTask, interval);
        }
      })
      .catch(cancelTask);
  }

  return new AutoRunningTask(
    () => {
      runTask();
      return lockPromise;
    },
    () => cancelTask(new Error(cancelMessage ?? 'Task was cancelled')),
  );
}
