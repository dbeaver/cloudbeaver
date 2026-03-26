/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { StorageService } from '@cloudbeaver/core-storage';
import { schema } from '@cloudbeaver/core-utils';

import type { ContainerDataSource } from '../ContainerDataSource.js';
import { isFilterConstraint, isOrderConstraint } from '../DatabaseDataModel/Actions/DatabaseDataConstraintAction.js';
import { GridViewAction } from '../DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { IDatabaseDataViewAction } from '../DatabaseDataModel/Actions/IDatabaseDataViewAction.js';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataViewerPersistedState, IPersistedConstraint } from './IDataViewerPersistedState.js';

const STORAGE_KEY = 'dataviewer-table-states';

const persistedConstraintSchema = schema.object({
  attributeName: schema.string().min(1),
  operator: schema.string().optional(),
  value: schema.unknown().optional(),
  orderAsc: schema.boolean().optional(),
  orderPosition: schema.number().optional(),
});

const persistedStateSchema = schema.object({
  constraints: schema.array(persistedConstraintSchema),
  whereFilter: schema.string(),
  pinnedColumns: schema.array(schema.string()),
  columnOrder: schema.array(schema.string()).optional(),
});

@injectable(() => [StorageService])
export class DataViewerTableStateService {
  private readonly states: Map<string, IDataViewerPersistedState>;

  constructor(private readonly storageService: StorageService) {
    this.states = new Map();

    makeObservable<DataViewerTableStateService, 'states'>(this, {
      states: observable,
      saveState: action,
      clearState: action,
    });

    this.storageService.registerSettings(
      STORAGE_KEY,
      this.states,
      () => new Map(),
      (map: Map<string, IDataViewerPersistedState>) => this.validateMap(map),
    );
  }

  saveState(objectId: string, model: IDatabaseDataModel<ContainerDataSource>): void {
    const options = model.source.options;

    if (!options) {
      return;
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

    if (hasState) {
      const state: IDataViewerPersistedState = { constraints, whereFilter, pinnedColumns };

      if (columnOrder.length > 0) {
        state.columnOrder = columnOrder;
      }

      this.states.set(objectId, state);
    } else {
      this.states.delete(objectId);
    }
  }

  restoreState(objectId: string): IDataViewerPersistedState | null {
    const state = this.states.get(objectId);

    if (!state || !this.validateState(state)) {
      return null;
    }

    if (
      state.constraints.length === 0 &&
      !state.whereFilter &&
      state.pinnedColumns.length === 0 &&
      (!state.columnOrder || state.columnOrder.length === 0)
    ) {
      return null;
    }

    return state;
  }

  clearState(objectId: string): void {
    this.states.delete(objectId);
  }

  private validateMap(map: Map<string, IDataViewerPersistedState>): Map<string, IDataViewerPersistedState> {
    for (const [key, value] of Array.from(map.entries())) {
      if (!this.validateState(value)) {
        map.delete(key);
      }
    }
    return map;
  }

  private validateState(data: IDataViewerPersistedState): boolean {
    return persistedStateSchema.safeParse(data).success;
  }
}
