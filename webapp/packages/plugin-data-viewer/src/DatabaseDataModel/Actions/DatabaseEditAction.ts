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
import type { DatabaseEditChangeType, IDatabaseDataEditAction, IDatabaseDataEditActionData, IDatabaseDataEditApplyActionData } from './IDatabaseDataEditAction';

@databaseDataAction()
export abstract class DatabaseEditAction<TKey, TValue, TResult extends IDatabaseDataResult>
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataEditAction<TKey, TValue, TResult> {
  static dataFormat: ResultDataFormat[] | null = null;

  readonly action: ISyncExecutor<IDatabaseDataEditActionData<TKey, TValue>>;
  readonly applyAction: ISyncExecutor<IDatabaseDataEditApplyActionData<any>>;
  protected features: Array<keyof this>;

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.action = new SyncExecutor();
    this.applyAction = new SyncExecutor();
    this.features = [];
  }

  hasFeature(feature: keyof this): boolean {
    return this.features.includes(feature);
  }

  abstract isEdited(): boolean;
  abstract isElementEdited(key: TKey): boolean;
  abstract getElementState(key: TKey): DatabaseEditChangeType | null;
  abstract get(key: TKey): TValue | undefined;
  abstract set(key: TKey, value: TValue): void;
  abstract add(key?: TKey): void;
  abstract duplicate(...key: TKey[]): void;
  abstract delete(...key: TKey[]): void;
  abstract applyUpdate(result: TResult): void;
  abstract revert(...key: TKey[]): void;
  abstract clear(): void;
}
