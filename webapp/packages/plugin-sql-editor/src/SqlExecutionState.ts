/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { EDeferredState } from '@cloudbeaver/core-utils';

import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

export class SqlExecutionState {
  @computed get isSqlExecuting(): boolean {
    return this.currentlyExecutingQuery ? this.currentlyExecutingQuery.isInProgress : false;
  }

  @computed get canCancel(): boolean {
    return this.currentlyExecutingQuery ? this.currentlyExecutingQuery.getState() === EDeferredState.PENDING : false;
  }

  cancelSQlExecuting = () => {
    if (this.currentlyExecutingQuery) {
      this.currentlyExecutingQuery.cancel();
    }
  };

  @observable private currentlyExecutingQuery: SQLQueryExecutionProcess | null = null;

  async setCurrentlyExecutingQuery(queryExecutionProcess: SQLQueryExecutionProcess): Promise<void> {
    if (this.currentlyExecutingQuery) {
      throw new Error('Simultaneous execution of several queries is forbidden');
    }
    this.currentlyExecutingQuery = queryExecutionProcess;

    try {
      await queryExecutionProcess.promise;
    } finally {
      this.currentlyExecutingQuery = null;
    }
  }
}
