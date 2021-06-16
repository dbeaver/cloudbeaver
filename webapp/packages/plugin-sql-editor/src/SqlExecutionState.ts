/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable, makeObservable } from 'mobx';

import { Deferred, EDeferredState } from '@cloudbeaver/core-utils';

export class SqlExecutionState {
  constructor() {
    makeObservable<SqlExecutionState, 'executionTask'>(this, {
      isExecuting: computed,
      canCancel: computed,
      executionTask: observable.ref,
    });
  }

  get isExecuting(): boolean {
    return this.executionTask ? this.executionTask.isInProgress : false;
  }

  get canCancel(): boolean {
    return this.executionTask ? this.executionTask.getState() === EDeferredState.PENDING : false;
  }

  cancelTask = () => {
    if (this.executionTask) {
      this.executionTask.cancel();
    }
  };

  private executionTask: Deferred<any> | null = null;

  setExecutionTask(executionTask: Deferred<any>): void {
    if (this.executionTask) {
      throw new Error('Simultaneous execution of several queries is forbidden');
    }
    this.executionTask = executionTask;

    executionTask.promise.finally(() => {
      this.executionTask = null;
    });
  }
}
