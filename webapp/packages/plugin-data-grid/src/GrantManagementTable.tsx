/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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

export interface IGrantManagementTableColumn {
  key: string;
  label: TLocalizationToken;
}

const SELECT_COLUMN: IGrantManagementTableColumn = { key: 'gmt_select', label: '' };
const STATUS_COLUMN: IGrantManagementTableColumn = { key: 'gmt_status', label: 'ui_granted' };

const DEFAULT_COLUMNS: IGrantManagementTableColumn[] = [SELECT_COLUMN, STATUS_COLUMN];

export interface IGrantManagementTableProps<T> {
  items: T[];
  columns: IGrantManagementTableColumn[];
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

  const [sort, setSort] = useState<'asc' | 'desc' | null>('desc');
  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);

  const visibleItems = useMemo(() => {
    if (isVisible) {
      return items.filter(item => isVisible(item, deferredFilter));
    }

    return items;
  }, [isVisible, items, deferredFilter]);

  const sortedItems = useMemo(() => {
    if (sort) {
      return visibleItems.slice().sort((a, b) => {
        const aGranted = isGranted(a);
        const bGranted = isGranted(b);

        if (aGranted === bGranted) {
          return 0;
        }

        const granted = sort === 'asc' ? aGranted : !aGranted;
        return granted ? 1 : -1;
      });
    }

    return visibleItems;
  }, [visibleItems, sort, isGranted]);

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

  const _columns = useMemo(() => [...DEFAULT_COLUMNS, ...columns], [columns]);

  function _getCell(rowIdx: number, colIdx: number) {
    const row = sortedItems[rowIdx] as T;
    const column = _columns[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === SELECT_COLUMN.key) {
      return <TableRowSelect id={getItemId(row)} disabled={isManageable?.(row) === false} />;
    }

    if (column.key === STATUS_COLUMN.key) {
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
    _columns,
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
    () => _columns.length,
    onValueChange => reaction(() => _columns.length, onValueChange),
    [_columns],
  );

  const rowsCount = useCreateGridReactiveValue(
    () => visibleItems.length,
    onValueChange => reaction(() => visibleItems.length, onValueChange),
    [visibleItems],
  );

  function getHeaderText(colIdx: number) {
    return translate(_columns[colIdx]?.label) ?? '';
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
    [_columns, translate],
  );

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    _columns,
    translate,
  ]);

  function getColumnSortable(colIdx: number) {
    return colIdx === 1;
  }

  const columnSortable = useCreateGridReactiveValue(
    getColumnSortable,
    (onValueChange, colIdx) => reaction(() => getColumnSortable(colIdx), onValueChange),
    [],
  );

  function getColumnSortingState(colIdx: number) {
    if (colIdx === 1) {
      return sort;
    }

    return null;
  }

  const columnSortingState = useCreateGridReactiveValue(
    getColumnSortingState,
    (onValueChange, colIdx) => reaction(() => getColumnSortingState(colIdx), onValueChange),
    [sort],
  );

  function handleSort(colIdx: number, order: 'asc' | 'desc' | null) {
    if (colIdx === 1) {
      setSort(order);
    }
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
