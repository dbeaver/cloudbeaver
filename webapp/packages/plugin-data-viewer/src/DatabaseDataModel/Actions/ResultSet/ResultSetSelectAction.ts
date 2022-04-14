/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, IReactionDisposer, makeObservable, observable, reaction, toJS } from 'mobx';

import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import { DatabaseSelectAction } from '../DatabaseSelectAction';
import { DatabaseEditChangeType, IDatabaseDataEditActionData, IDatabaseDataEditApplyActionData } from '../IDatabaseDataEditAction';
import type { DatabaseDataSelectActionsData } from '../IDatabaseDataSelectAction';
import type { IResultSetColumnKey, IResultSetElementKey, IResultSetPartialKey, IResultSetRowKey } from './IResultSetDataKey';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataKeysUtils } from './ResultSetDataKeysUtils';
import { ResultSetEditAction } from './ResultSetEditAction';
import type { IResultSetValue } from './ResultSetFormatAction';
import { ResultSetViewAction } from './ResultSetViewAction';

@databaseDataAction()
export class ResultSetSelectAction extends DatabaseSelectAction<any, IDatabaseResultSet> {
  static dataFormat = [ResultDataFormat.Resultset];

  get elements(): IResultSetElementKey[] {
    return Array.from(this.selectedElements.values()).flat();
  }

  readonly actions: ISyncExecutor<DatabaseDataSelectActionsData<IResultSetPartialKey>>;
  readonly selectedElements: Map<string, IResultSetElementKey[]>;

  private focusedElement: IResultSetElementKey | null;
  private readonly view: ResultSetViewAction;
  private readonly edit: ResultSetEditAction;
  private readonly data: ResultSetDataAction;
  private readonly validationDisposer: IReactionDisposer;

  constructor(
    source: IDatabaseDataSource<any, IDatabaseResultSet>,
    result: IDatabaseResultSet,
    view: ResultSetViewAction,
    edit: ResultSetEditAction,
    data: ResultSetDataAction
  ) {
    super(source, result);
    this.view = view;
    this.edit = edit;
    this.data = data;
    this.actions = new SyncExecutor();
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

    this.validationDisposer = reaction(() => this.view.rowKeys, (current, previous) => {
      if (this.focusedElement) {
        const focus = this.focusedElement;
        const currentIndex = current.findIndex(key => ResultSetDataKeysUtils.isEqual(key, focus.row));

        const focusIndex = previous.findIndex(key => ResultSetDataKeysUtils.isEqual(key, focus.row));

        if (currentIndex >= 0 && focusIndex === -1) {
          return;
        }

        if (focusIndex === -1 || current.length === 0) {
          this.focus(null);
          return;
        }

        if (!current.some(key => ResultSetDataKeysUtils.isEqual(key, focus.row))) {
          for (let index = focusIndex; index >= 0; index--) {
            const previousElement = previous[index];
            const row = current.find(key => ResultSetDataKeysUtils.isEqual(key, previousElement));

            if (row) {
              this.focus({ ...this.focusedElement, row });
              return;
            }
          }
          for (let index = focusIndex; index <= previous.length; index++) {
            const nextElement = previous[index];
            const row = current.find(key => ResultSetDataKeysUtils.isEqual(key, nextElement));

            if (row) {
              this.focus({ ...this.focusedElement, row });
              return;
            }
          }

          this.focus({ ...this.focusedElement, row: current[current.length - 1] });
        }
      }
    });

    this.edit.action.addHandler(this.syncFocus.bind(this));
    this.edit.applyAction.addHandler(this.syncFocusOnUpdate.bind(this));
  }

  isSelected(): boolean {
    return this.selectedElements.size > 0;
  }

  isFocused(key: IResultSetElementKey): boolean {
    if (!this.focusedElement) {
      return false;
    }
    return (
      ResultSetDataKeysUtils.isEqual(key.column, this.focusedElement.column)
      && ResultSetDataKeysUtils.isEqual(key.row, this.focusedElement.row)
    );
  }

  isElementSelected(key: IResultSetPartialKey): boolean {
    if (key.row === undefined) {
      for (const row of this.view.rowKeys) {
        if (!this.isElementSelected({ row, column: key.column })) {
          return false;
        }
      }

      return true;
    }

    const row = this.selectedElements.get(ResultSetDataKeysUtils.serialize(key.row));

    if (!row) {
      return false;
    }

    if (key.column !== undefined) {
      return this.isColumnSelected(row, key.column);
    }

    return row.length === this.view.columnKeys.length;
  }

  getFocusedElement(): IResultSetElementKey | null {
    return this.focusedElement;
  }

  getRowSelection(row: IResultSetRowKey): IResultSetElementKey[] {
    return this.selectedElements.get(ResultSetDataKeysUtils.serialize(row)) || [];
  }

  getSelectedElements(): IResultSetElementKey[] {
    return Array.from(this.selectedElements.values()).flat();
  }

  getActiveElements(): IResultSetElementKey[] {
    const elements = this.getSelectedElements();
    const focus = this.getFocusedElement();

    if (elements.length === 0 && focus) {
      return [focus];
    }

    return elements;
  }

  getSelectedRows(): IResultSetElementKey[] {
    const cells: IResultSetElementKey[] = [];
    const rowsKeys = new Set<string>();

    const elements = this.getSelectedElements();

    for (const cell of elements) {
      const key = ResultSetDataKeysUtils.serialize(cell.row);

      if (!rowsKeys.has(key)) {
        cells.push(cell);
        rowsKeys.add(key);
      }
    }

    return cells;
  }

  getActiveRows(): IResultSetElementKey[] {
    const elements = this.getSelectedRows();
    const focus = this.getFocusedElement();

    if (elements.length === 0 && focus) {
      return [focus];
    }

    return elements;
  }

  set(key: IResultSetPartialKey, selected: boolean, silent?: boolean): void {
    if (key.row === undefined) {
      for (const row of this.view.rowKeys) {
        this.set({ row, column: key.column }, selected, true);
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
        this.set({ row: key.row, column }, selected, true);
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
      if (!this.selectedElements.has(ResultSetDataKeysUtils.serialize(key.row))) {
        if (!selected) {
          return;
        }
        this.selectedElements.set(ResultSetDataKeysUtils.serialize(key.row), []);
      }

      const columns = this.selectedElements.get(ResultSetDataKeysUtils.serialize(key.row))!;

      if (selected) {
        if (!this.isColumnSelected(columns, key.column)) {
          columns.push(key as IResultSetElementKey);
        }
      } else {
        this.removeColumnSelection(columns, key.column);

        if (columns.length === 0) {
          this.selectedElements.delete(ResultSetDataKeysUtils.serialize(key.row));
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

  focus(key: IResultSetElementKey | null): void {
    if (
      (key && this.isFocused(key))
      || key === this.focusedElement
    ) {
      return;
    }

    this.focusedElement = toJS(key);
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

  afterResultUpdate(): void {
    this.validateSelection();
  }

  dispose(): void {
    this.validationDisposer();
  }

  private validateSelection() {
    let focusedElement = this.focusedElement;

    if (focusedElement && !this.view.has(focusedElement)) {
      focusedElement = null;
    }

    const removeKeys: string[] = [];
    const selectedElements = this.selectedElements.entries();

    for (const [key, rowSelection] of selectedElements) {
      const element = rowSelection[0];
      if (element && !this.view.has(element)) {
        removeKeys.push(key);
      }
    }

    this.focus(focusedElement);

    for (const key of removeKeys) {
      this.selectedElements.delete(key);
    }
  }

  private syncFocusOnUpdate(data: IDatabaseDataEditApplyActionData<IResultSetRowKey>) {
    let nextFocus = {
      ...this.data.getDefaultKey(),
      ...this.focusedElement,
    };

    for (const update of data.updates) {
      switch (update.type) {
        case DatabaseEditChangeType.add:
          if (nextFocus === null || ResultSetDataKeysUtils.isEqual(update.row, nextFocus.row)) {
            nextFocus = { ...nextFocus, row: update.newRow };
          }
          break;

        case DatabaseEditChangeType.delete:
          if (nextFocus === null || ResultSetDataKeysUtils.isEqual(update.row, nextFocus.row)) {
            nextFocus = { ...nextFocus, row: update.newRow };
          }
          this.set({ row: update.row }, false, true);
          break;
      }
    }

    this.focus(nextFocus);
  }

  private syncFocus(data: IDatabaseDataEditActionData<IResultSetElementKey, IResultSetValue>) {
    switch (data.type) {
      case DatabaseEditChangeType.add:
        if (data.value) {
          if (data.revert) {
            // this.focus({ ...data.value.key, row: this.view.getShift(data.value.key.row) });
          } else if (data.value.length > 0) {
            this.focus(data.value[data.value.length - 1].key);
          }
          this.clear();
        }
        break;

      case DatabaseEditChangeType.delete:
        if (data.value && data.value.length > 0) {
          this.focus(data.value[0].key);
          this.clear();
        }
        break;
      case DatabaseEditChangeType.update:
        if (data.value && data.value.length > 0) {
          this.focus(data.value[data.value.length - 1].key);
        }
        break;
    }
  }

  private isColumnSelected(list: IResultSetElementKey[], key: IResultSetColumnKey) {
    return list.some(selected => ResultSetDataKeysUtils.isEqual(selected.column, key));
  }

  private removeColumnSelection(list: IResultSetElementKey[], key: IResultSetColumnKey) {
    const index = list.findIndex(selected => ResultSetDataKeysUtils.isEqual(selected.column, key));

    if (index >= 0) {
      list.splice(index, 1);
    }
  }
}
