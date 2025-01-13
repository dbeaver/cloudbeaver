/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { ConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { TransactionLogInfoItem } from '@cloudbeaver/core-sdk';
import type { ILoadableState } from '@cloudbeaver/core-utils';

interface Payload {
  transaction: ConnectionExecutionContext;
}

interface State extends ILoadableState {
  log: TransactionLogInfoItem[] | null;
  exception: Error | null;
  promise: Promise<TransactionLogInfoItem[]> | null;
  payload: Payload;
}

export function useTransactionLog(payload: Payload) {
  const state = useObservableRef<State>(
    () => ({
      log: null,
      exception: null,
      promise: null,
      isLoaded() {
        return this.log !== null;
      },
      isError() {
        return this.exception !== null;
      },
      isLoading() {
        return this.promise !== null;
      },
      async load() {
        try {
          this.exception = null;

          this.promise = payload.transaction.getLog();
          const log = await this.promise;
          this.log = log;
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.promise = null;
        }
      },
    }),
    { log: observable.ref, promise: observable.ref, exception: observable.ref, payload: observable.ref },
    { payload },
  );

  return state;
}
