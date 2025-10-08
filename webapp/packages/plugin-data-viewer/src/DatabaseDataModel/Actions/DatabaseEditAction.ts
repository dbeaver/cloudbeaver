/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import type { IDatabaseDataSource } from '../IDatabaseDataSource.js';
import type {
  DatabaseEditChangeType,
  IDatabaseDataEditAction,
  IDatabaseDataEditActionData,
  IDatabaseDataEditApplyActionData,
} from './IDatabaseDataEditAction.js';
import { makeObservable, observable } from 'mobx';

export abstract class DatabaseEditAction<
    TKey = unknown,
    TValue = unknown,
    TUpdate extends IDatabaseDataEditApplyActionData = IDatabaseDataEditApplyActionData,
    TResult extends IDatabaseDataResult = IDatabaseDataResult,
  >
  extends DatabaseDataAction<any, TResult>
  implements IDatabaseDataEditAction<TKey, TValue, TUpdate, TResult>
{
  static dataFormat: ResultDataFormat[] | null = null;

  readonly action: ISyncExecutor<IDatabaseDataEditActionData<TKey, TValue>>;
  readonly applyAction: ISyncExecutor<TUpdate>;
  protected features: Array<keyof this>;

  constructor(source: IDatabaseDataSource<any, TResult>, result: TResult) {
    super(source, result);
    this.action = new SyncExecutor();
    this.applyAction = new SyncExecutor();
    this.features = [];

    makeObservable<this, 'features'>(this, {
      features: observable.shallow,
    });
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
  abstract applyPartialUpdate(resultId: string | null, rows: TValue[][]): void;
  abstract applyUpdate(resultId: string | null, rows: TValue[][]): void;
  abstract revert(...key: TKey[]): void;
  abstract clear(): void;
}
