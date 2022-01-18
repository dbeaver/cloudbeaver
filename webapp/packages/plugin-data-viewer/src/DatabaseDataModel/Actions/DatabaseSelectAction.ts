/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { IDatabaseDataSource } from '../IDatabaseDataSource';
import { databaseDataAction } from './DatabaseDataActionDecorator';
import type { DatabaseDataSelectActionsData, IDatabaseDataSelectAction } from './IDatabaseDataSelectAction';

@databaseDataAction()
export abstract class DatabaseSelectAction<TKey, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataSelectAction<TKey, TResult> {
  static dataFormat: ResultDataFormat[] | null = null;
  readonly actions: ISyncExecutor<DatabaseDataSelectActionsData<TKey>>;

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.actions = new SyncExecutor();
  }

  abstract isSelected(): boolean;
  abstract isElementSelected(key: TKey): boolean;
  abstract getFocusedElement(): TKey | null;
  abstract getSelectedElements(): TKey[];
  abstract getActiveElements(): TKey[];
  abstract set(key: TKey, selected: boolean): void;
  abstract clear(): void;
}
