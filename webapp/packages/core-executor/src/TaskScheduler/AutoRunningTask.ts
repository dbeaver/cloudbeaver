/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITask } from './ITask.js';
import { Task } from './Task.js';

export class AutoRunningTask<TValue> extends Task<TValue> {
  constructor(task: () => Promise<TValue>, externalCancel?: () => Promise<void> | void) {
    super(task, externalCancel);
    this.run();
  }

  static resolve<TValue>(value: TValue): ITask<TValue> {
    return new AutoRunningTask(() => Promise.resolve(value));
  }

  static reject<TValue>(exception: any): ITask<TValue> {
    return new AutoRunningTask(() => Promise.reject(exception));
  }
}
