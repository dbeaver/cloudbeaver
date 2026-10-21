/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import { Button, CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, Fill, useTranslate } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useTableSelection } from '@cloudbeaver/plugin-data-grid';

import type { INodeDeletionDialogItem } from './NodeDeletionPlan.js';
import { NodeDeletionTable } from './NodeDeletionTable.js';

export const NodeDeletionDialog: DialogComponent<{ items: INodeDeletionDialogItem[] }, string[]> = observer(function NodeDeletionDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const rows = payload.items;
  const singleItem = rows.length === 1 ? rows[0] : undefined;
  const keys = useMemo(() => rows.filter(item => !item.reason).map(item => item.id), [rows]);
  const state = useMemo(() => observable.set(keys), [keys]);
  const selection = useTableSelection(keys, state);
  const selected = new Set(selection.selected);
  const count = selected.size;
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

  function handleCancel() {
    rejectDialog();
  }

  function handleDelete() {
    resolveDialog(selection.selected);
  }

  return (
    <CommonDialogWrapper fixedWidth={!!singleItem} size={singleItem ? 'small' : 'large'} aria-label={translate('ui_data_delete_confirmation')}>
      <CommonDialogHeader title="ui_data_delete_confirmation" icon="/icons/preload/error_icon.svg" bigIcon onReject={handleCancel} />
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
        {!singleItem && <NodeDeletionTable items={rows} selection={selection} />}
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" variant="secondary" onClick={handleCancel}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Button type="button" disabled={!count} onClick={handleDelete}>
          {translate('ui_delete')}
          {!singleItem && ` (${count})`}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
