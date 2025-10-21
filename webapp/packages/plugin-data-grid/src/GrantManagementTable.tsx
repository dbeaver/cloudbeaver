/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { action, computed, observable, reaction } from 'mobx';

import { Button, clsx } from '@dbeaver/ui-kit';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { Checkbox, Filter, s, useObservableRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useCreateGridReactiveValue, type IDataGridCellRenderer } from '@dbeaver/react-data-grid';

import { DataGrid } from './DataGridLazy.js';

import classes from './GrantManagementTable.module.css';

interface IColumn {
  key: string;
  label: TLocalizationToken;
}

const DEFAULT_COLUMNS: IColumn[] = [
  { key: 'select', label: '' },
  { key: 'status', label: 'ui_granted' },
];

interface IState<T> {
  readonly _items: T[];
  readonly selectedCount: number;
  readonly itemsCount: number;
  filter: string;
  selected: Set<string>;
  select(id: string): void;
  grant(): void;
  revoke(): void;
  selectAll(): void;
  isGranted: (item: T) => boolean;
  onGrant: (ids: string[]) => void;
  onRevoke: (ids: string[]) => void;
  getItemId: (item: T) => string;
  isManageable?: (item: T) => boolean;
  isVisible?: (item: T, filter: string) => boolean;
}

export interface IGrantManagementTableProps<T> {
  items: T[];
  columns: IColumn[];
  getItemId: (item: T) => string;
  isGranted: (item: T) => boolean;
  isEdited: (item: T) => boolean;
  onGrant: (ids: string[]) => void;
  onRevoke: (ids: string[]) => void;
  disabled?: boolean;
  isManageable?: (item: T) => boolean;
  isVisible?: (item: T, filter: string) => boolean;
  getCell?: (item: T, colKey: string) => React.ReactNode;
}

export const GrantManagementTable = observer(function GrantManagementTable<T>({
  columns,
  items,
  getItemId,
  isGranted,
  isEdited,
  onGrant,
  onRevoke,
  disabled,
  isManageable,
  isVisible,
  getCell,
}: IGrantManagementTableProps<T>) {
  const translate = useTranslate();
  const styles = useS(classes);

  const state: IState<T> = useObservableRef(
    () => ({
      get _items() {
        if (!this.filter) {
          return this.items;
        }

        return this.isVisible ? this.items.filter(item => this.isVisible?.(item, this.filter)) : this.items;
      },
      get selectedCount() {
        const manageable = [];

        for (const id of this.selected) {
          const item = this._items.find(i => this.getItemId(i) === id);

          if (item && this.isManageable?.(item)) {
            manageable.push(id);
          }
        }

        return manageable.length;
      },
      get itemsCount() {
        const manageable = this.isManageable ? this._items.filter(this.isManageable) : this._items;
        return manageable.length;
      },
      filter: '',
      selected: new Set<string>(),
      select(id: string) {
        if (this.selected.has(id)) {
          this.selected.delete(id);
        } else {
          this.selected.add(id);
        }
      },
      grant() {
        const granted = Array.from(this.selected).filter(id => {
          const item = this._items.find(i => this.getItemId(i) === id);
          return item && !this.isGranted(item);
        });
        this.onGrant(granted);
        this.selected.clear();
      },
      revoke() {
        const revoked = Array.from(this.selected).filter(id => {
          const item = this._items.find(i => this.getItemId(i) === id);
          return item && this.isGranted(item);
        });
        this.onRevoke(revoked);
        this.selected.clear();
      },
      selectAll() {
        const isAll = this.itemsCount > 0 && this.itemsCount === this.selectedCount;

        for (const item of this._items) {
          if (this.isManageable?.(item)) {
            const id = this.getItemId(item);

            if (isAll) {
              this.selected.delete(id);
            } else {
              this.selected.add(id);
            }
          }
        }
      },
    }),
    {
      _items: computed,
      selectedCount: computed,
      itemsCount: computed,
      filter: observable.ref,
      selected: observable,
      select: action.bound,
      grant: action.bound,
      revoke: action.bound,
      selectAll: action.bound,
    },
    { items, isManageable, isVisible, isGranted, onGrant, onRevoke, getItemId },
  );

  const _columns = useMemo(() => [...DEFAULT_COLUMNS, ...columns], [columns]);

  function _getCell(rowIdx: number, colIdx: number) {
    const row = state._items[rowIdx] as T;
    const column = _columns[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === 'select') {
      return (
        <Checkbox
          disabled={isManageable?.(row) === false}
          checked={state.selected.has(getItemId(row))}
          onChange={() => state.select(getItemId(row))}
        />
      );
    }

    if (column.key === 'status') {
      const granted = isGranted(row);
      return <div className={`tw:m-auto tw:h-2 tw:w-2 tw:rounded-full tw:bg-[var(--${granted ? 'theme-positive' : 'theme-background'})]`} />;
    }

    return getCell?.(row, column.key) ?? getItemId(row);
  }

  const cell = useCreateGridReactiveValue(_getCell, (onValueChange, rowIds, colIdx) => reaction(() => _getCell(rowIds, colIdx), onValueChange), [
    state,
    _columns,
    isGranted,
    isManageable,
    getCell,
    getItemId,
  ]);

  function getCellElement(rowIdx: number, colIdx: number, props: React.HTMLAttributes<HTMLDivElement>, renderDefaultCell: IDataGridCellRenderer) {
    const row = state._items[rowIdx];

    if (!row) {
      return null;
    }

    const edited = isEdited(row);

    return renderDefaultCell({ className: clsx(edited && 'edited') });
  }

  const cellElement = useCreateGridReactiveValue(
    getCellElement,
    (onValueChange, rowIdx, colIdx, props, renderDefaultCell) =>
      reaction(() => getCellElement(rowIdx, colIdx, props, renderDefaultCell), onValueChange),
    [state, isEdited],
  );

  const columnsCount = useCreateGridReactiveValue(
    () => _columns.length,
    onValueChange => reaction(() => _columns.length, onValueChange),
    [_columns],
  );

  const rowsCount = useCreateGridReactiveValue(
    () => state._items.length,
    onValueChange => reaction(() => state._items.length, onValueChange),
    [state._items],
  );

  function getHeaderText(colIdx: number) {
    return translate(_columns[colIdx]?.label) ?? '';
  }

  function getHeaderElement(colIdx: number) {
    if (colIdx === 0) {
      const indeterminate = state.selectedCount > 0 && state.itemsCount !== state.selectedCount;
      const checked = state.itemsCount > 0 && state.itemsCount === state.selectedCount;
      return <Checkbox disabled={state.itemsCount === 0} checked={checked} indeterminate={indeterminate} onChange={state.selectAll} />;
    }

    return getHeaderText(colIdx);
  }

  const headerElement = useCreateGridReactiveValue(
    getHeaderElement,
    (onValueChange, colIdx) => reaction(() => getHeaderElement(colIdx), onValueChange),
    [_columns, state],
  );

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    _columns,
  ]);

  return (
    <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-2 tw:max-w-max tw:overflow-auto">
      <div className="tw:flex tw:items-center tw:gap-6">
        <Filter state={state} name="filter" placeholder={translate('ui_search')} />

        {state.selectedCount > 0 && (
          <div className="tw:shrink-0 tw:flex tw:items-center tw:gap-2">
            <div className="tw:text-(--theme-text-hint-on-light)">{state.selectedCount} selected</div>
            <Button disabled={disabled} variant="secondary" size="small" onClick={state.grant}>
              {translate('ui_grant')}
            </Button>
            <Button disabled={disabled} variant="secondary" size="small" onClick={state.revoke}>
              {translate('ui_revoke')}
            </Button>
          </div>
        )}
      </div>
      <div className={s(styles, { table: true })}>
        <DataGrid
          columnCount={columnsCount}
          rowCount={rowsCount}
          getHeaderResizable={colIdx => colIdx > 1}
          getRowHeight={() => 32}
          getHeaderPinned={colIdx => colIdx <= 1}
          headerElement={headerElement}
          headerText={headerText}
          cell={cell}
          cellElement={cellElement}
        />
      </div>
    </div>
  );
});
