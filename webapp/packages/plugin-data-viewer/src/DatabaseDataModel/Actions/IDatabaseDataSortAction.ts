/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';
import type { SortMode } from './ResultSet/ResultSetSortAction';

export interface IDatabaseDataSortAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  setSortMode: (columnName: string, sortMode: SortMode, multiple: boolean) => void;
  getSortMode: (columnName: string) => SortMode;
}
