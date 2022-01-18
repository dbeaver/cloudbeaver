/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITask } from '@cloudbeaver/core-executor';

import type { IConnectionExecutionContextInfo } from './IConnectionExecutionContextInfo';

export interface IConnectionExecutionContext {
  readonly context: IConnectionExecutionContextInfo | undefined;
  readonly executing: boolean;
  readonly cancellable: boolean;

  run: <T>(
    task: () => Promise<T>,
    cancel?: () => Promise<any> | void,
    end?: () => Promise<any> | void
  ) => ITask<T>;
  cancel: () => Promise<void>;
  destroy: () => Promise<void>;
  update: (defaultCatalog?: string, defaultSchema?: string) => Promise<void>;
}
