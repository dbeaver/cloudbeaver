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
import classes from './GrantManagementTable.module.css';
import { TableSelectionContext } from './TableSelectionContext.js';
import { TableRowSelect } from './TableRowSelect.js';

interface IColumn {
  key: string;
  label: TLocalizationToken;
}

const DEFAULT_COLUMNS: IColumn[] = [
  { key: 'select', label: '' },
  { key: 'status', label: 'ui_granted' },
];

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

  const [filter, setFilter] = useState('');
  const deferredFilter = useDeferredValue(filter);

  const _items = useMemo(() => {
    if (deferredFilter) {
      return isVisible ? items.filter(item => isVisible(item, deferredFilter)) : items;
    }

    return items;
  }, [isVisible, items, deferredFilter]);

  const keys = useMemo(() => _items.filter(i => isManageable?.(i) === true).map(getItemId), [_items, getItemId, isManageable]);
  const selection = useTableSelection(keys);

  function grant() {
    const prev = _items.filter(item => isGranted(item)).map(getItemId);
    const granted = selection.list.filter(id => !prev.includes(id));

    onGrant(granted);
    selection.clear();
  }

  function revoke() {
    const prev = _items.filter(item => isGranted(item)).map(getItemId);
    const revoked = selection.list.filter(id => prev.includes(id));

    onRevoke(revoked);
    selection.clear();
  }

  const _columns = useMemo(() => [...DEFAULT_COLUMNS, ...columns], [columns]);

  function _getCell(rowIdx: number, colIdx: number) {
    const row = _items[rowIdx] as T;
    const column = _columns[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === 'select') {
      return <TableRowSelect id={getItemId(row)} disabled={isManageable?.(row) === false} />;
    }

    if (column.key === 'status') {
      const granted = isGranted(row);
      return <div className={`tw:m-auto tw:h-2 tw:w-2 tw:rounded-full tw:bg-[var(--${granted ? 'theme-positive' : 'theme-background'})]`} />;
    }

    return getCell?.(row, column.key) ?? getItemId(row);
  }

  const cell = useCreateGridReactiveValue(_getCell, (onValueChange, rowIds, colIdx) => reaction(() => _getCell(rowIds, colIdx), onValueChange), [
    _items,
    _columns,
    isGranted,
    isManageable,
    getCell,
    getItemId,
  ]);

  function getCellElement(rowIdx: number, colIdx: number, props: React.HTMLAttributes<HTMLDivElement>, renderDefaultCell: IDataGridCellRenderer) {
    const row = _items[rowIdx];

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
    [_items, isEdited],
  );

  const columnsCount = useCreateGridReactiveValue(
    () => _columns.length,
    onValueChange => reaction(() => _columns.length, onValueChange),
    [_columns],
  );

  const rowsCount = useCreateGridReactiveValue(
    () => _items.length,
    onValueChange => reaction(() => _items.length, onValueChange),
    [_items],
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
    [_columns],
  );

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    _columns,
  ]);

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
          />
        </div>
      </TableSelectionContext>
    </div>
  );
});
