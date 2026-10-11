/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  StaticImage,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { DataGrid, useCellCopy, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';

import type { INodeDeletionItem } from './NodeDeletionPlan.js';

const COLUMNS = [
  { label: 'ui_name', width: '40%' },
  { label: 'plugin_navigation_tree_delete_location', width: '60%' },
];

export const NodeDeletionDialog: DialogComponent<{ items: INodeDeletionItem[] }, void> = observer(function NodeDeletionDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const cellCopy = useCellCopy();
  const rows = payload.items;
  const singleItem = rows.length === 1 ? rows[0] : undefined;
  const count = rows.length;
  const columnCount = useCreateGridReactiveValue(() => COLUMNS.length, null, []);
  const rowCount = useCreateGridReactiveValue(() => rows.length, null, [rows]);
  const headerText = useCreateGridReactiveValue(colIdx => translate(COLUMNS[colIdx]?.label) ?? '', null, [translate]);
  const cell = useCreateGridReactiveValue(getCell, null, [rows, translate]);
  const warnings = [...new Set(rows.map(item => item.warning).filter(Boolean))];

  function getCell(rowIdx: number, colIdx: number) {
    const item = rows[rowIdx];
    if (!item) {
      return null;
    }
    if (colIdx === 0) {
      return (
        <span title={item.node.name} className="tw:flex tw:items-center tw:gap-2">
          {item.node.icon && <StaticImage icon={item.node.icon} title={translate(item.type)} className="tw:size-4 tw:shrink-0" />}
          <span>{item.node.name}</span>
        </span>
      );
    }
    const value = item.location || '—';
    return <span title={value}>{value}</span>;
  }

  return (
    <CommonDialogWrapper fixedWidth={!!singleItem} size={singleItem ? 'small' : 'large'} aria-label={translate('ui_data_delete_confirmation')}>
      <CommonDialogHeader title="ui_data_delete_confirmation" icon="/icons/preload/error_icon.svg" bigIcon onReject={() => rejectDialog()} />
      <CommonDialogBody>
        <p className="tw:break-all">
          {singleItem
            ? translate('plugin_navigation_tree_delete_confirmation_single', undefined, {
                name: singleItem.node.name,
                entity: translate(singleItem.type).toLowerCase(),
              })
            : translate('plugin_navigation_tree_delete_confirmation')}
        </p>
        {warnings.map(warning => (
          <p key={warning}>{translate(warning)}</p>
        ))}
        {!singleItem && (
          <div role="region" aria-label={translate('ui_data_delete_confirmation')} className="tw:w-full tw:mt-4">
            <DataGrid
              columnCount={columnCount}
              rowCount={rowCount}
              headerText={headerText}
              cell={cell}
              getHeaderWidth={colIdx => COLUMNS[colIdx]?.width ?? 'auto'}
              getRowHeight={() => 36}
              onCellKeyDown={cellCopy.handleKeyDown}
            />
          </div>
        )}
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Button type="button" disabled={!count} onClick={() => resolveDialog()}>
          {translate('ui_delete')}
          {!singleItem && ` (${count})`}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
