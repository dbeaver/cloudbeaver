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
import { Checkbox, Filter, s, useObjectRef, useObservableRef, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useCreateGridReactiveValue, type IDataGridCellRenderer } from '@dbeaver/react-data-grid';

import { DataGrid } from './DataGridLazy.js';

import classes from './GrantManagementTable.module.css';

interface IColumn {
  key: string;
  label: TLocalizationToken;
}

const DEFAULT_COLUMNS: IColumn[] = [
  { key: 'select', label: '' },
  { key: 'status', label: 'Granted' },
];

export interface IGrantManagementTableItem {
  id: string;
}

interface IState<T> {
  readonly items: T[];
  readonly selectedCount: number;
  readonly itemsCount: number;
  filter: string;
  selected: Set<string>;
  select(id: string): void;
  grant(): void;
  revoke(): void;
  selectAll(): void;
}

export interface IGrantManagementTableProps<T extends IGrantManagementTableItem = IGrantManagementTableItem> {
  items: T[];
  columns: IColumn[];
  isGranted: (id: string) => boolean;
  isEdited: (id: string) => boolean;
  onGrant: (ids: string[]) => void;
  onRevoke: (ids: string[]) => void;
  disabled?: boolean;
  isManageable?: (item: T) => boolean;
  isVisible?: (item: T, filter: string) => boolean;
  getCell?: (item: T, colKey: string) => React.ReactNode;
}

export const GrantManagementTable = observer(function GrantManagementTable<T extends IGrantManagementTableItem = IGrantManagementTableItem>({
  columns,
  items,
  isGranted,
  isEdited,
  onGrant,
  onRevoke,
  disabled,
  isManageable,
  isVisible,
  getCell,
}: IGrantManagementTableProps<T>) {
  const props = useObjectRef({ isGranted, isManageable, isVisible, onGrant, onRevoke, getCell });

  const translate = useTranslate();
  const styles = useS(classes);

  const state = useObservableRef<IState<T>>(
    () => ({
      get items() {
        if (!this.filter) {
          return items;
        }

        return isVisible ? items.filter(item => isVisible(item, this.filter)) : items;
      },
      get selectedCount() {
        const manageable = [];

        for (const id of this.selected) {
          const item = this.items.find(i => i.id === id);

          if (item && props.isManageable?.(item)) {
            manageable.push(id);
          }
        }

        return manageable.length;
      },
      get itemsCount() {
        const manageable = props.isManageable ? this.items.filter(props.isManageable) : this.items;
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
        const granted = Array.from(this.selected).filter(id => !props.isGranted(id));
        props.onGrant(granted);
        this.selected.clear();
      },
      revoke() {
        const revoked = Array.from(this.selected).filter(id => props.isGranted(id));
        props.onRevoke(revoked);
        this.selected.clear();
      },
      selectAll() {
        const isAll = this.itemsCount > 0 && this.itemsCount === this.selectedCount;

        for (const item of this.items) {
          if (props.isManageable?.(item)) {
            if (isAll) {
              this.selected.delete(item.id);
            } else {
              this.selected.add(item.id);
            }
          }
        }
      },
    }),
    {
      items: computed,
      selectedCount: computed,
      itemsCount: computed,
      filter: observable.ref,
      selected: observable,
      select: action.bound,
      grant: action.bound,
      revoke: action.bound,
      selectAll: action.bound,
    },
    false,
  );

  const _columns = useMemo(() => [...DEFAULT_COLUMNS, ...columns], [columns.length]);

  function _getCell(rowIdx: number, colIdx: number) {
    const row = state.items[rowIdx] as T;
    const column = _columns[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === 'select') {
      const disabled = props.isManageable ? !props.isManageable(row) : false;
      return <Checkbox disabled={disabled} checked={state.selected.has(row.id)} onChange={() => state.select(row.id)} />;
    }

    if (column.key === 'status') {
      const granted = props.isGranted(row.id);
      return <div className={`tw:m-auto tw:h-2 tw:w-2 tw:rounded-full tw:bg-[var(--${granted ? 'theme-positive' : 'theme-background'})]`} />;
    }

    return props.getCell?.(row, column.key) ?? row.id;
  }

  const cell = useCreateGridReactiveValue(_getCell, (onValueChange, rowIds, colIdx) => reaction(() => _getCell(rowIds, colIdx), onValueChange), [
    state.items,
    _columns,
  ]);

  function getCellElement(rowIdx: number, colIdx: number, props: React.HTMLAttributes<HTMLDivElement>, renderDefaultCell: IDataGridCellRenderer) {
    const row = state.items[rowIdx];

    if (!row) {
      return null;
    }

    const edited = isEdited(row.id);

    return renderDefaultCell({ className: clsx(edited && 'edited') });
  }

  const cellElement = useCreateGridReactiveValue(
    getCellElement,
    (onValueChange, rowIdx, colIdx, props, renderDefaultCell) =>
      reaction(() => getCellElement(rowIdx, colIdx, props, renderDefaultCell), onValueChange),
    [],
  );

  const columnsCount = useCreateGridReactiveValue(
    () => _columns.length,
    onValueChange => reaction(() => _columns.length, onValueChange),
    [_columns],
  );

  const rowsCount = useCreateGridReactiveValue(
    () => state.items.length,
    onValueChange => reaction(() => state.items.length, onValueChange),
    [state.items],
  );

  function getHeaderText(colIdx: number) {
    if (colIdx === 0) {
      const indeterminate = state.selectedCount > 0 && state.itemsCount !== state.selectedCount;
      const checked = state.itemsCount > 0 && state.itemsCount === state.selectedCount;
      return <Checkbox disabled={state.itemsCount === 0} checked={checked} indeterminate={indeterminate} onChange={state.selectAll} />;
    }

    return translate(_columns[colIdx]?.label) ?? '';
  }

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), []);

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
          getHeaderResizable={colIdx => colIdx !== 0 && colIdx !== 1}
          getRowHeight={() => 32}
          getHeaderWidth={() => null}
          getHeaderPinned={colIdx => colIdx === 0 || colIdx === 1}
          headerText={headerText}
          cell={cell}
          cellElement={cellElement}
        />
      </div>
    </div>
  );
});
