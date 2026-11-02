/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useId, useMemo } from 'react';

import { IconOrImage, StaticImage, useTranslate } from '@cloudbeaver/core-blocks';
import {
  DataGrid,
  type ITableSelection,
  TableRowSelect,
  TableSelectionContext,
  useCellCopy,
  useCreateGridReactiveValue,
} from '@cloudbeaver/plugin-data-grid';

import type { INodeDeletionDialogItem } from './NodeDeletionPlan.js';

interface Props {
  items: INodeDeletionDialogItem[];
  selection: ITableSelection;
}

export const NodeDeletionTable = observer<Props>(function NodeDeletionTable({ items, selection }) {
  const id = useId();
  const translate = useTranslate();
  const cellCopy = useCellCopy();
  const selected = new Set(selection.selected);
  const hasReason = items.some(item => item.reason);
  const columns = useMemo(
    () => [
      { label: 'ui_select_all', width: '40px' },
      { label: 'ui_name', width: hasReason ? '30%' : '40%' },
      { label: 'plugin_navigation_tree_delete_location', width: hasReason ? '35%' : '60%' },
      ...(hasReason ? [{ label: 'plugin_navigation_tree_delete_status', width: '35%' }] : []),
    ],
    [hasReason],
  );

  const columnCount = useCreateGridReactiveValue(() => columns.length, null, [columns]);
  const rowCount = useCreateGridReactiveValue(() => items.length, null, [items]);
  const headerText = useCreateGridReactiveValue(colIdx => translate(columns[colIdx]?.label) ?? '', null, [columns, translate]);
  const headerElement = useCreateGridReactiveValue(
    colIdx => (colIdx === 0 ? <TableRowSelect isRoot /> : (translate(columns[colIdx]?.label) ?? '')),
    null,
    [columns, translate],
  );

  const cell = useCreateGridReactiveValue(getCell, null, [items, translate, selection.selected]);

  function getCell(rowIdx: number, colIdx: number) {
    const item = items[rowIdx];

    if (!item) {
      return null;
    }

    if (colIdx === 0) {
      return (
        <TableRowSelect id={item.id} disabled={!!item.reason} title={item.name} aria-describedby={item.reason ? `${id}-${rowIdx}` : undefined} />
      );
    }

    if (colIdx === 3) {
      return item.reason ? (
        <span id={`${id}-${rowIdx}`} className="tw:whitespace-normal tw:break-words">
          {translate(item.reason)}
        </span>
      ) : null;
    }

    const opacity = selected.has(item.id) ? '' : 'tw:opacity-40';

    if (colIdx === 1) {
      return (
        <span title={item.name} className={`tw:flex tw:items-center tw:gap-2 ${opacity}`}>
          {item.icon && <StaticImage icon={item.icon} title={translate(item.type)} className="tw:size-4 tw:shrink-0" />}
          {item.readOnly && <IconOrImage icon="/icons/lock.png" title={translate('ui_readonly')} className="tw:size-4 tw:shrink-0" />}
          <span>{item.name}</span>
        </span>
      );
    }

    const value = item.location || '—';

    return (
      <span title={value} className={opacity}>
        {value}
      </span>
    );
  }

  return (
    <div role="region" aria-label={translate('ui_data_delete_confirmation')} className="tw:w-full tw:mt-4">
      <TableSelectionContext value={selection}>
        <DataGrid
          columnCount={columnCount}
          rowCount={rowCount}
          headerText={headerText}
          headerElement={headerElement}
          cell={cell}
          getHeaderWidth={colIdx => columns[colIdx]?.width ?? 'auto'}
          getHeaderPinned={colIdx => colIdx === 0}
          getHeaderResizable={colIdx => colIdx !== 0}
          getRowHeight={rowIdx => (items[rowIdx]?.reason ? 72 : 36)}
          onCellKeyDown={cellCopy.handleKeyDown}
        />
      </TableSelectionContext>
    </div>
  );
});
