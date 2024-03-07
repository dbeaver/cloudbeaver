/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import type { ITask } from '@cloudbeaver/core-executor';

export interface ITransactionExecutionContext {
  readonly context: IConnectionExecutionContextInfo | undefined;
  readonly executing: boolean;
  readonly cancellable: boolean;

  run: <T>(task: () => Promise<T>, cancel?: () => Promise<any> | void, end?: () => Promise<any> | void) => ITask<T>;
  cancel: () => Promise<void>;
  destroy: () => Promise<void>;
}
