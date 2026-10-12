/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  IconOrImage,
  StaticImage,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import {
  DataGrid,
  TableRowSelect,
  TableSelectionContext,
  useCellCopy,
  useCreateGridReactiveValue,
  useTableSelection,
} from '@cloudbeaver/plugin-data-grid';

export interface INodeDeletionDialogItem {
  id: string;
  name: string;
  icon?: string;
  type: string;
  readOnly?: boolean;
  project: string;
  location: string;
  warning?: string;
  reason?: string;
  ancestors?: string[];
}

const COLUMNS = [
  { label: 'ui_select_all', width: '40px' },
  { label: 'ui_name', width: '40%' },
  { label: 'plugin_navigation_tree_delete_location', width: '60%' },
];

export const NodeDeletionDialog: DialogComponent<{ items: INodeDeletionDialogItem[] }, string[]> = observer(function NodeDeletionDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const cellCopy = useCellCopy();
  const rows = payload.items;
  const singleItem = rows.length === 1 ? rows[0] : undefined;
  const keys = useMemo(() => rows.filter(item => !item.reason).map(item => item.id), [rows]);
  const selection = useTableSelection(keys, keys);
  const selected = new Set(selection.selected);
  const count = selected.size;
  const columnCount = useCreateGridReactiveValue(() => COLUMNS.length, null, []);
  const rowCount = useCreateGridReactiveValue(() => rows.length, null, [rows]);
  const headerText = useCreateGridReactiveValue(colIdx => translate(COLUMNS[colIdx]?.label) ?? '', null, [translate]);
  const headerElement = useCreateGridReactiveValue(
    colIdx => (colIdx === 0 ? <TableRowSelect isRoot /> : (translate(COLUMNS[colIdx]?.label) ?? '')),
    null,
    [translate],
  );
  const cell = useCreateGridReactiveValue(getCell, null, [rows, translate, selection.selected]);
  const warnings = [
    ...new Set(
      rows
        .filter(item => selected.has(item.id))
        .map(item => item.warning)
        .filter(Boolean),
    ),
  ];
  const messages = warnings.map(warning => ({ key: warning, content: <>{translate(warning)}</> }));
  if (count !== rows.length) {
    messages.unshift({
      key: 'selection-summary',
      content: (
        <>
          <strong>{translate('plugin_navigation_tree_delete_selection_count', undefined, { count, total: rows.length })}</strong>{' '}
          {translate('plugin_navigation_tree_delete_selection_summary')}
        </>
      ),
    });
  }

  const select = action((id: string) => {
    selection.select(id);
    const checked = selection.state.has(id);
    const item = rows.find(item => item.id === id);
    for (const row of rows) {
      if (row.reason) {
        continue;
      }
      if (checked && row.ancestors?.includes(id)) {
        selection.state.add(row.id);
      } else if (!checked && item?.ancestors?.includes(row.id)) {
        selection.state.delete(row.id);
      }
    }
  });

  function getCell(rowIdx: number, colIdx: number) {
    const item = rows[rowIdx];
    if (!item) {
      return null;
    }
    if (colIdx === 0) {
      return <TableRowSelect id={item.id} disabled={!!item.reason} title={item.reason ? translate(item.reason) : item.name} onSelect={select} />;
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
    <CommonDialogWrapper fixedWidth={!!singleItem} size={singleItem ? 'small' : 'large'} aria-label={translate('ui_data_delete_confirmation')}>
      <CommonDialogHeader title="ui_data_delete_confirmation" icon="/icons/preload/error_icon.svg" bigIcon onReject={() => rejectDialog()} />
      <CommonDialogBody>
        <p className="tw:break-all">
          {singleItem
            ? translate('plugin_navigation_tree_delete_confirmation_single', undefined, {
                name: singleItem.name,
                entity: translate(singleItem.type).toLowerCase(),
              })
            : translate('plugin_navigation_tree_delete_confirmation')}
        </p>
        <br />
        {messages.length > 1 && (
          <ul className="tw:list-disc tw:pl-5 tw:space-y-2">
            {messages.map(message => (
              <li key={message.key}>{message.content}</li>
            ))}
          </ul>
        )}
        {messages.length === 1 && <p>{messages[0]!.content}</p>}
        {!singleItem && (
          <div role="region" aria-label={translate('ui_data_delete_confirmation')} className="tw:w-full tw:mt-4">
            <TableSelectionContext value={selection}>
              <DataGrid
                columnCount={columnCount}
                rowCount={rowCount}
                headerText={headerText}
                headerElement={headerElement}
                cell={cell}
                getHeaderWidth={colIdx => COLUMNS[colIdx]?.width ?? 'auto'}
                getHeaderPinned={colIdx => colIdx === 0}
                getHeaderResizable={colIdx => colIdx !== 0}
                getRowHeight={() => 36}
                onCellKeyDown={cellCopy.handleKeyDown}
              />
            </TableSelectionContext>
          </div>
        )}
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Button type="button" disabled={!count} onClick={() => resolveDialog(selection.selected)}>
          {translate('ui_delete')}
          {!singleItem && ` (${count})`}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
