/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutor } from '@cloudbeaver/core-executor';

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';

export type DatabaseDataSelectActionsData<TKey> = {
  type: 'select';
  resultId: string;
  key: TKey;
  selected: boolean;
} | {
  type: 'clear';
  resultId: string;
};

export interface IDatabaseDataSelectAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  readonly actions: IExecutor<DatabaseDataSelectActionsData<TKey>>;
  isSelected: () => boolean;
  isElementSelected: (key: TKey) => boolean;
  getFocusedElement: () => TKey | null;
  getSelectedElements: () => TKey[];
  set: (key: TKey, selected: boolean) => void;
  focus: (key: TKey | null) => void;
  clear: () => void;
}
