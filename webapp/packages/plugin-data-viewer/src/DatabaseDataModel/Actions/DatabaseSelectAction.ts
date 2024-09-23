/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import type { IDatabaseDataSource } from '../IDatabaseDataSource.js';
import { databaseDataAction } from './DatabaseDataActionDecorator.js';
import type { DatabaseDataSelectActionsData, IDatabaseDataSelectAction } from './IDatabaseDataSelectAction.js';

@databaseDataAction()
export abstract class DatabaseSelectAction<TKey = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataSelectAction<TKey, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;
  readonly actions: ISyncExecutor<DatabaseDataSelectActionsData<TKey>>;

  constructor(source: IDatabaseDataSource<any, TResult>) {
    super(source);
    this.actions = new SyncExecutor();
  }

  abstract isSelected(): boolean;
  abstract isElementSelected(key: TKey): boolean;
  abstract isFocused(key: TKey): boolean;
  abstract getFocusedElement(): TKey | null;
  abstract getSelectedElements(): TKey[];
  abstract getActiveElements(): TKey[];
  abstract set(key: TKey, selected: boolean): void;
  abstract focus(key: TKey | null): void;
  abstract clear(): void;
}
