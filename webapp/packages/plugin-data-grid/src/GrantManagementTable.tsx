/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useDeferredValue, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

import { Button, clsx } from '@dbeaver/ui-kit';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { Filter, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useCreateGridReactiveValue, type IDataGridCellRenderer } from '@dbeaver/react-data-grid';

import { DataGrid } from './DataGridLazy.js';
import { useTableSelection } from './useTableSelection.js';
import { TableSelectionContext } from './TableSelectionContext.js';
import { TableRowSelect } from './TableRowSelect.js';
import classes from './GrantManagementTable.module.css';

export interface IGrantManagementTableColumn<T = unknown> {
  key: string;
  label: TLocalizationToken;
  compare?: (a: T, b: T) => number;
}

const SELECT_COLUMN: IGrantManagementTableColumn = { key: 'gmt_select', label: '' };
const STATUS_COLUMN_KEY = 'gmt_status';

export interface IGrantManagementTableProps<T> {
  items: T[];
  columns: IGrantManagementTableColumn<T>[];
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

  const [sort, setSort] = useState<{ colIdx: number; order: 'asc' | 'desc' } | null>({ colIdx: 1, order: 'desc' });
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);

  const visibleItems = useMemo(() => {
    if (isVisible) {
      return items.filter(item => isVisible(item, deferredFilter));
    }

    return items;
  }, [isVisible, items, deferredFilter]);

  const allColumns = useMemo<IGrantManagementTableColumn<T>[]>(() => {
    const statusColumn: IGrantManagementTableColumn<T> = {
      key: STATUS_COLUMN_KEY,
      label: 'ui_granted',
      compare: (a, b) => Number(isGranted(a)) - Number(isGranted(b)),
    };

    return [SELECT_COLUMN, statusColumn, ...columns];
  }, [columns, isGranted]);

  const sortedItems = useMemo(() => {
    if (sort) {
      const column = allColumns[sort.colIdx];

      if (column?.compare) {
        const compare = column.compare;
        return visibleItems.slice().sort((a, b) => (sort.order === 'asc' ? compare(a, b) : compare(b, a)));
      }
    }

    return visibleItems;
  }, [visibleItems, sort, allColumns]);

  const keys = useMemo(() => {
    const filtered = isManageable ? visibleItems.filter(isManageable) : visibleItems;
    return filtered.map(getItemId);
  }, [visibleItems, getItemId, isManageable]);

  const selection = useTableSelection(keys);

  function grant() {
    const prev = visibleItems.filter(item => isGranted(item)).map(getItemId);
    const granted = selection.list.filter(id => !prev.includes(id));

    onGrant(granted);
    selection.clear();
  }

  function revoke() {
    const prev = visibleItems.filter(item => isGranted(item)).map(getItemId);
    const revoked = selection.list.filter(id => prev.includes(id));

    onRevoke(revoked);
    selection.clear();
  }

  function _getCell(rowIdx: number, colIdx: number) {
    const row = sortedItems[rowIdx] as T;
    const column = allColumns[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === SELECT_COLUMN.key) {
      return <TableRowSelect id={getItemId(row)} disabled={isManageable?.(row) === false} />;
    }

    if (column.key === STATUS_COLUMN_KEY) {
      const granted = isGranted(row);
      return (
        <div
          className={clsx('tw:m-auto tw:h-2 tw:w-2 tw:rounded-full tw:bg-[var(--theme-background)]', granted && 'tw:bg-[var(--theme-positive)]')}
        />
      );
    }

    return getCell?.(row, column.key) ?? null;
  }

  const cell = useCreateGridReactiveValue(_getCell, (onValueChange, rowIds, colIdx) => reaction(() => _getCell(rowIds, colIdx), onValueChange), [
    sortedItems,
    allColumns,
    isGranted,
    isManageable,
    getCell,
    getItemId,
  ]);

  function getCellElement(rowIdx: number, colIdx: number, props: React.HTMLAttributes<HTMLDivElement>, renderDefaultCell: IDataGridCellRenderer) {
    const row = sortedItems[rowIdx];

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
    [sortedItems, isEdited],
  );

  const columnsCount = useCreateGridReactiveValue(
    () => allColumns.length,
    onValueChange => reaction(() => allColumns.length, onValueChange),
    [allColumns],
  );

  const rowsCount = useCreateGridReactiveValue(
    () => visibleItems.length,
    onValueChange => reaction(() => visibleItems.length, onValueChange),
    [visibleItems],
  );

  function getHeaderText(colIdx: number) {
    return translate(allColumns[colIdx]?.label) ?? '';
  }

  function getHeaderElement(colIdx: number) {
    if (colIdx === 0) {
      return <TableRowSelect isRoot />;
    }

    return getHeaderText(colIdx);
  }

  const headerElement = useCreateGridReactiveValue(
    getHeaderElement,
    (onValueChange, colIdx) => reaction(() => getHeaderElement(colIdx), onValueChange),
    [allColumns, translate],
  );

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    allColumns,
    translate,
  ]);

  function getColumnSortable(colIdx: number) {
    return allColumns[colIdx]?.compare !== undefined;
  }

  const columnSortable = useCreateGridReactiveValue(
    getColumnSortable,
    (onValueChange, colIdx) => reaction(() => getColumnSortable(colIdx), onValueChange),
    [allColumns],
  );

  function getColumnSortingState(colIdx: number) {
    if (sort?.colIdx === colIdx) {
      return sort.order;
    }

    return null;
  }

  const columnSortingState = useCreateGridReactiveValue(
    getColumnSortingState,
    (onValueChange, colIdx) => reaction(() => getColumnSortingState(colIdx), onValueChange),
    [sort],
  );

  function handleSort(colIdx: number, order: 'asc' | 'desc' | null) {
    setSort(order ? { colIdx, order } : null);
  }

  return (
    <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-2 tw:max-w-max tw:overflow-auto">
      <div className="tw:flex tw:items-center tw:gap-6">
        <Filter value={filter} placeholder={translate('ui_search')} onChange={setFilter} />

        {selection.selected.length > 0 && (
          <div className="tw:shrink-0 tw:flex tw:items-center tw:gap-2">
            <div className="tw:text-(--theme-text-hint-on-light)">{selection.selected.length} selected</div>
            <Button disabled={disabled} variant="secondary" size="small" onClick={grant}>
              {translate('ui_grant')}
            </Button>
            <Button disabled={disabled} variant="secondary" size="small" onClick={revoke}>
              {translate('ui_revoke')}
            </Button>
          </div>
        )}
      </div>
      <TableSelectionContext value={selection}>
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
            columnSortable={columnSortable}
            columnSortingState={columnSortingState}
            onColumnSort={handleSort}
          />
        </div>
      </TableSelectionContext>
    </div>
  );
});
