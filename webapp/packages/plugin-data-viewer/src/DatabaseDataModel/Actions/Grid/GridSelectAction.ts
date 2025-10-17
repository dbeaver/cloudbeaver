/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, type IReactionDisposer, makeObservable, observable, reaction, toJS } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import { DatabaseSelectAction } from '../DatabaseSelectAction.js';
import {
  DatabaseEditChangeType,
  IDatabaseDataEditAction,
  type IDatabaseDataEditActionData,
  type IDatabaseDataEditApplyActionData,
} from '../IDatabaseDataEditAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { GridDataKeysUtils } from '../Grid/GridDataKeysUtils.js';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import type { IGridColumnKey, IGridDataKey, IGridRowKey } from './IGridDataKey.js';
import { IDatabaseDataViewAction } from '../IDatabaseDataViewAction.js';
import { IDatabaseDataResultAction } from '../IDatabaseDataResultAction.js';
import type { GridViewAction } from './GridViewAction.js';
import type { GridEditAction, IGridEditApplyActionData } from './GridEditAction.js';
import type { GridDataResultAction } from './GridDataResultAction.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, IDatabaseDataResultAction, IDatabaseDataViewAction, IDatabaseDataEditAction])
export class GridSelectAction<
  TColumn = unknown,
  TRow = unknown,
  TCell = unknown,
  TKey extends IGridDataKey = IGridDataKey,
  TResult extends IDatabaseDataResult = IDatabaseDataResult,
> extends DatabaseSelectAction<Partial<TKey>, TResult> {
  static override dataFormat = [ResultDataFormat.Resultset];

  get elements(): TKey[] {
    return Array.from(this.selectedElements.values()).flat();
  }

  readonly selectedElements: Map<string, TKey[]>;

  private focusedElement: TKey | null;
  private readonly view: GridViewAction<TColumn, TRow, TKey, TCell, TResult>;
  private readonly data: GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
  private readonly edit?: GridEditAction<TColumn, TRow, TKey, TCell, TResult>;
  private readonly validationDisposer: IReactionDisposer;

  constructor(
    source: IDatabaseDataSource<unknown, TResult>,
    result: TResult,
    data: IDatabaseDataResultAction<TKey, TResult>,
    view: IDatabaseDataViewAction<any, TCell, TResult>,
    edit?: IDatabaseDataEditAction<unknown, TCell, IDatabaseDataEditApplyActionData, TResult>,
  ) {
    super(source, result);
    this.view = view as GridViewAction<TColumn, TRow, TKey, TCell, TResult>;
    this.data = data as GridDataResultAction<TColumn, TRow, TKey, TCell, TResult>;
    this.edit = edit as GridEditAction<TColumn, TRow, TKey, TCell, TResult> | undefined;
    this.selectedElements = new Map();
    this.focusedElement = null;

    makeObservable<this, 'focusedElement'>(this, {
      selectedElements: observable,
      focusedElement: observable.ref,
      elements: computed,
      set: action,
      focus: action,
      clear: action,
    });

    this.validationDisposer = reaction(
      () => this.view.rowKeys,
      (current, previous) => {
        if (this.focusedElement) {
          const focus = this.focusedElement;
          const currentIndex = current.findIndex(key => GridDataKeysUtils.isEqual(key, focus.row));

          const focusIndex = previous.findIndex(key => GridDataKeysUtils.isEqual(key, focus.row));

          if (currentIndex >= 0 && focusIndex === -1) {
            return;
          }

          if (focusIndex === -1 || current.length === 0) {
            this.focus(null);
            return;
          }

          if (!current.some(key => GridDataKeysUtils.isEqual(key, focus.row))) {
            for (let index = focusIndex; index >= 0; index--) {
              const previousElement = previous[index]!;
              const row = current.find(key => GridDataKeysUtils.isEqual(key, previousElement));

              if (row) {
                this.focus({ ...this.focusedElement, row });
                return;
              }
            }
            for (let index = focusIndex; index <= previous.length; index++) {
              const nextElement = previous[index]!;
              const row = current.find(key => GridDataKeysUtils.isEqual(key, nextElement));

              if (row) {
                this.focus({ ...this.focusedElement, row });
                return;
              }
            }

            this.focus({ ...this.focusedElement, row: current[current.length - 1]! });
          }
        }
      },
    );

    this.edit?.action.addHandler(this.syncFocus.bind(this));
    this.edit?.applyAction.addHandler(this.syncFocusOnUpdate.bind(this));
  }

  isSelected(): boolean {
    return this.selectedElements.size > 0;
  }

  isFocused(key: TKey): boolean {
    if (!this.focusedElement) {
      return false;
    }
    return GridDataKeysUtils.isEqual(key.column, this.focusedElement.column) && GridDataKeysUtils.isEqual(key.row, this.focusedElement.row);
  }

  isElementSelected(key: Partial<TKey>): boolean {
    if (key.row === undefined) {
      for (const row of this.view.rowKeys) {
        if (!this.isElementSelected({ row, column: key.column } as Partial<TKey>)) {
          return false;
        }
      }

      return true;
    }

    const row = this.selectedElements.get(GridDataKeysUtils.serialize(key.row));

    if (!row) {
      return false;
    }

    if (key.column !== undefined) {
      return this.isColumnSelected(row, key.column);
    }

    return row.length === this.view.columnKeys.length;
  }

  getFocusedElement(): TKey | null {
    return this.focusedElement;
  }

  getRowSelection(row: IGridRowKey): TKey[] {
    return this.selectedElements.get(GridDataKeysUtils.serialize(row)) || [];
  }

  getSelectedElements(): TKey[] {
    return Array.from(this.selectedElements.values()).flat();
  }

  getActiveElements(): TKey[] {
    const elements = this.getSelectedElements();
    const focus = this.getFocusedElement();

    if (elements.length === 0 && focus) {
      return [focus];
    }

    return elements;
  }

  getSelectedRows(): TKey[] {
    const cells: TKey[] = [];
    const rowsKeys = new Set<string>();

    const elements = this.getSelectedElements();

    for (const cell of elements) {
      const key = GridDataKeysUtils.serialize(cell.row);

      if (!rowsKeys.has(key)) {
        cells.push(cell);
        rowsKeys.add(key);
      }
    }

    return cells;
  }

  getActiveRows(): TKey[] {
    const elements = this.getSelectedRows();
    const focus = this.getFocusedElement();

    if (elements.length === 0 && focus) {
      return [focus];
    }

    return elements;
  }

  set(key: Partial<TKey>, selected: boolean, silent?: boolean): void {
    if (key.row === undefined) {
      for (const row of this.view.rowKeys) {
        this.set({ row, column: key.column } as Partial<TKey>, selected, true);
      }

      if (!silent) {
        this.actions.execute({
          type: 'select',
          resultId: this.result.id,
          key,
          selected,
        });
      }
      return;
    }

    if (key.column === undefined) {
      for (const column of this.view.columnKeys) {
        this.set({ row: key.row, column } as Partial<TKey>, selected, true);
      }
      if (!silent) {
        this.actions.execute({
          type: 'select',
          resultId: this.result.id,
          key,
          selected,
        });
      }
      return;
    }

    try {
      if (!this.selectedElements.has(GridDataKeysUtils.serialize(key.row))) {
        if (!selected) {
          return;
        }
        this.selectedElements.set(GridDataKeysUtils.serialize(key.row), []);
      }

      const columns = this.selectedElements.get(GridDataKeysUtils.serialize(key.row))!;

      if (selected) {
        if (!this.isColumnSelected(columns, key.column)) {
          columns.push(key as TKey);
        }
      } else {
        this.removeColumnSelection(columns, key.column);

        if (columns.length === 0) {
          this.selectedElements.delete(GridDataKeysUtils.serialize(key.row));
        }
      }
    } finally {
      if (!silent) {
        this.actions.execute({
          type: 'select',
          resultId: this.result.id,
          key,
          selected,
        });
      }
    }
  }

  focus(key: TKey | null): void {
    if (key && !this.view.has(key)) {
      key = null;
    }

    if ((key && this.isFocused(key)) || key === this.focusedElement) {
      return;
    }

    if (key) {
      key = JSON.parse(JSON.stringify(toJS(key)));
    }

    this.focusedElement = key;
    this.actions.execute({
      type: 'focus',
      resultId: this.result.id,
      key,
    });
  }

  clear(): void {
    this.selectedElements.clear();
    this.actions.execute({
      type: 'clear',
      resultId: this.result.id,
    });
  }

  override afterResultUpdate(): void {
    this.validateSelection();
  }

  override dispose(): void {
    this.validationDisposer();
  }

  private validateSelection() {
    let focusedElement = this.focusedElement;

    if (focusedElement && !this.view.has(focusedElement)) {
      focusedElement = null;
    }

    const removeKeys: TKey[] = [];
    const selectedElements = this.selectedElements.entries();

    for (const [, rowSelection] of selectedElements) {
      for (const element of rowSelection) {
        if (element && !this.view.has(element)) {
          removeKeys.push(element);
        }
      }
    }

    this.focus(focusedElement);

    for (const key of removeKeys) {
      this.set(key, false, true);
    }
  }

  private syncFocusOnUpdate(data: IGridEditApplyActionData) {
    let nextFocus: TKey = {
      ...this.data.getDefaultKey(),
      ...this.focusedElement,
    };

    for (const update of data.updates) {
      switch (update.type) {
        case DatabaseEditChangeType.add:
          if (nextFocus === null || GridDataKeysUtils.isEqual(update.row, nextFocus.row)) {
            nextFocus = { ...nextFocus, row: update.newRow };
          }
          break;

        case DatabaseEditChangeType.delete:
          if (nextFocus === null || GridDataKeysUtils.isEqual(update.row, nextFocus.row)) {
            nextFocus = { ...nextFocus, row: update.newRow };
          }
          this.set({ row: update.row } as Partial<TKey>, false, true);
          break;
      }
    }

    this.focus(nextFocus);
  }

  private syncFocus(data: IDatabaseDataEditActionData<TKey, TCell>) {
    switch (data.type) {
      case DatabaseEditChangeType.add:
        if (data.value) {
          if (data.revert) {
            // this.focus({ ...data.value.key, row: this.view.getShift(data.value.key.row) });
          } else if (data.value.length > 0) {
            this.focus(data.value[data.value.length - 1]!.key);
          }
          this.clear();
        }
        break;

      case DatabaseEditChangeType.delete:
        if (data.value && data.value.length > 0) {
          this.focus(data.value[0]!.key);
          this.clear();
        }
        break;
      case DatabaseEditChangeType.update:
        if (data.value && data.value.length > 0) {
          this.focus(data.value[data.value.length - 1]!.key);
        }
        break;
    }
  }

  private isColumnSelected(list: TKey[], key: IGridColumnKey) {
    return list.some(selected => GridDataKeysUtils.isEqual(selected.column, key));
  }

  private removeColumnSelection(list: TKey[], key: IGridColumnKey) {
    const index = list.findIndex(selected => GridDataKeysUtils.isEqual(selected.column, key));

    if (index >= 0) {
      list.splice(index, 1);
    }
  }
}
