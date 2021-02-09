/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useCallback, useMemo, useState } from 'react';

import type { SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';
import type { IDatabaseDataModel, SortMode } from '@cloudbeaver/plugin-data-viewer';

import type { IDataGridSortingContext } from './DataGridSortingContext';

export function useGridSortingContext(model: IDatabaseDataModel<any>) {
  const [sortedColumns] = useState(() => observable.map<string, SqlDataFilterConstraint>());

  const refreshModel = useCallback(async (constraints: SqlDataFilterConstraint[]) => {
    await model.setOptions({ ...model.source.options, constraints }).refresh();
  }, [model]);

  const setColumnSortMode = useCallback(async (colId: string, sort: SortMode, multiple: boolean) => {
    if (!multiple) {
      sortedColumns.clear();
    }

    if (sort !== null) {
      sortedColumns.set(colId, { attribute: colId, orderAsc: sort === 'asc' });
    } else {
      sortedColumns.delete(colId);
    }

    const constraints = Array.from(sortedColumns.values())
      .map((constrait, idx) => ({ ...constrait, orderPosition: idx }));

    await refreshModel(constraints);
  }, [refreshModel, sortedColumns]);

  const getColumnSortMode = useCallback((colId: string): SortMode => {
    if (!sortedColumns.has(colId)) {
      return null;
    }

    return sortedColumns.get(colId)!.orderAsc ? 'asc' : 'desc';
  }, [sortedColumns]);

  const gridSortingContext: IDataGridSortingContext = useMemo(() => ({
    sortedColumns,
    setSortMode: setColumnSortMode,
    getSortMode: getColumnSortMode,
  }), [sortedColumns, setColumnSortMode, getColumnSortMode]);

  return gridSortingContext;
}
