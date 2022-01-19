/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISyncExecutor } from '@cloudbeaver/core-executor';

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';

export type DatabaseDataSelectActionsData<TKey> = {
  type: 'select';
  resultId: string | null;
  key: TKey;
  selected: boolean;
} | {
  type: 'focus';
  resultId: string | null;
  key: TKey | null;
} | {
  type: 'clear';
  resultId: string | null;
};

export interface IDatabaseDataSelectAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  readonly actions: ISyncExecutor<DatabaseDataSelectActionsData<TKey>>;
  isSelected: () => boolean;
  isElementSelected: (key: TKey) => boolean;
  getFocusedElement: () => TKey | null;
  set: (key: TKey, selected: boolean) => void;
  clear: () => void;
}
