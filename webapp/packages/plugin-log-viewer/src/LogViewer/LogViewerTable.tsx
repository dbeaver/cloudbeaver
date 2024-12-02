/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, MenuBarSmallItem, s, Table, TableBody, TableColumnHeader, TableHeader, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { ILogEntry } from './ILogEntry.js';
import { LogEntry } from './LogEntry.js';
import styles from './LogViewerTable.module.css';

interface Props {
  items: ILogEntry[];
  selectedItem: ILogEntry | null;
  onItemSelect: (item: ILogEntry) => void;
  onClear: () => void;
  className?: string;
}
export const LogViewerTable = observer<Props>(function LogViewerTable({ items, selectedItem, onItemSelect, onClear, className }) {
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <Container className={s(style, { wrapper: true }, className)}>
      <MenuBarSmallItem
        className={s(style, { clearButton: true })}
        icon="trash"
        viewBox="0 0 24 24"
        title={translate('plugin_log_viewer_clear_log')}
        onClick={onClear}
      >
        {translate('ui_clear')}
      </MenuBarSmallItem>
      <Container className={s(style, { tableWrapper: true })} overflow>
        <Table className={s(style, { table: true })}>
          <TableHeader fixed>
            <TableColumnHeader className={s(style, { tableColumnHeader: true, tableColumnHeaderMin: true })} min />
            <TableColumnHeader className={s(style, { tableColumnHeader: true, timestamp: true })}>
              {translate('plugin_log_viewer_entry_timestamp')}
            </TableColumnHeader>
            <TableColumnHeader className={s(style, { tableColumnHeader: true })}>
              <div className={s(style, { messageTitleBox: true })}>
                <div className={s(style, { messageTitle: true })}>{translate('plugin_log_viewer_entry_message')}</div>
              </div>
            </TableColumnHeader>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <LogEntry key={item.id} item={item} selected={item.id === selectedItem?.id} onSelect={onItemSelect} />
            ))}
          </TableBody>
        </Table>
      </Container>
    </Container>
  );
});
