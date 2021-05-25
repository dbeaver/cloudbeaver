/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';

export enum ESortMode {
  'asc' = 'asc',
  'desc' = 'desc'
}

export type SortMode = ESortMode | null;

export interface IDatabaseDataConstraintAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  deleteAllConstraints: () => void;
  deleteFilter: (columnName: string) => void;
  deleteFiltersFromConstraints: () => void;
  deleteSortingFromConstraints: () => void;
  setFilter: (columnName: string, operator: string, value?: any) => void;
  setSortMode: (columnName: string, sortMode: SortMode, multiple: boolean) => void;
  getFilter: (columnName: string) => void;
  getSortMode: (columnName: string) => SortMode;
  getFilterConstraints: () => SqlDataFilterConstraint[];
  getSortingConstraints: () => SqlDataFilterConstraint[];
}
