/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ContainerDataSource } from '../ContainerDataSource.js';
import { isFilterConstraint, isOrderConstraint } from '../DatabaseDataModel/Actions/DatabaseDataConstraintAction.js';
import { GridViewAction } from '../DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { IDatabaseDataViewAction } from '../DatabaseDataModel/Actions/IDatabaseDataViewAction.js';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataViewerPersistedState, IPersistedConstraint } from './IDataViewerPersistedState.js';

export function buildPersistedState(model: IDatabaseDataModel<ContainerDataSource>): IDataViewerPersistedState | null {
  const options = model.source.options;

  if (!options) {
    return null;
  }

  const result = model.source.getResult(0);
  const columns = result?.data?.columns;

  const constraints: IPersistedConstraint[] = [];

  for (const constraint of options.constraints) {
    const attributeName = constraint.attributeName ?? columns?.find(c => c.position === constraint.attributePosition)?.name;

    if (!attributeName) {
      continue;
    }

    const persisted: IPersistedConstraint = { attributeName };

    if (isFilterConstraint(constraint)) {
      persisted.operator = constraint.operator ?? undefined;
      persisted.value = constraint.value ?? undefined;
    }

    if (isOrderConstraint(constraint)) {
      persisted.orderAsc = constraint.orderAsc ?? undefined;
      persisted.orderPosition = constraint.orderPosition ?? undefined;
    }

    constraints.push(persisted);
  }

  let pinnedColumns: string[] = [];
  const columnOrder: string[] = [];
  const viewAction = model.source.tryGetAction(0, IDatabaseDataViewAction, GridViewAction);

  if (viewAction) {
    pinnedColumns = viewAction.getPinnedColumnNames();

    let isCustomOrder = false;

    const keys = viewAction.columnKeys;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]!;
      const name = viewAction.getColumnName(key);

      if (name) {
        columnOrder.push(name);
      }

      if (key.index !== i) {
        isCustomOrder = true;
      }
    }

    if (!isCustomOrder) {
      columnOrder.length = 0;
    }
  }

  const whereFilter = options.whereFilter || '';
  const hasState = constraints.length > 0 || whereFilter.length > 0 || pinnedColumns.length > 0 || columnOrder.length > 0;

  if (!hasState) {
    return null;
  }

  const state: IDataViewerPersistedState = { constraints, whereFilter, pinnedColumns };

  if (columnOrder.length > 0) {
    state.columnOrder = columnOrder;
  }

  return state;
}
