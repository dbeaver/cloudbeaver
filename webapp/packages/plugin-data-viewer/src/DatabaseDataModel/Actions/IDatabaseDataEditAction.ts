/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import { createService } from '@cloudbeaver/core-di';

// order is matter, used for sorting and changes diff
export enum DatabaseEditChangeType {
  update = 0,
  add = 1,
  delete = 2,
}

export interface IDatabaseDataEditActionValue<TKey, TValue> {
  key: TKey;
  nextKey?: TKey;
  value?: TValue;
  prevValue?: TValue;
}

export interface IDatabaseDataEditApplyActionUpdate {
  type?: DatabaseEditChangeType;
}

export interface IDatabaseDataEditApplyActionData {
  resultId: string | null;
  updates: Array<IDatabaseDataEditApplyActionUpdate>;
}

export interface IDatabaseDataEditActionData<TKey, TValue> {
  revert: boolean;
  type?: DatabaseEditChangeType;
  resultId: string | null;
  value?: Array<IDatabaseDataEditActionValue<TKey, TValue>>;
}

export interface IDatabaseDataEditAction<
  TKey = unknown,
  TValue = unknown,
  TUpdate extends IDatabaseDataEditApplyActionData = IDatabaseDataEditApplyActionData,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
> extends IDatabaseDataAction<any, TResult> {
  readonly action: ISyncExecutor<IDatabaseDataEditActionData<TKey, TValue>>;
  readonly applyAction: ISyncExecutor<TUpdate>;
  isEdited: () => boolean;
  isElementEdited: (key: TKey) => boolean;
  hasFeature: (feature: keyof this) => boolean;
  getElementState: (key: TKey) => DatabaseEditChangeType | null;
  get: (key: TKey) => TValue | undefined;
  set: (key: TKey, value: TValue) => void;
  add: (key?: TKey) => void;
  duplicate: (...key: TKey[]) => void;
  delete: (...key: TKey[]) => void;
  applyPartialUpdate(resultId: string, rows: TValue[][]): void;
  applyUpdate: (resultId: string, rows: TValue[][]) => void;
  revert: (...key: TKey[]) => void;
  clear: () => void;
}

export const IDatabaseDataEditAction = createService<IDatabaseDataEditAction>('IDatabaseDataEditAction');
