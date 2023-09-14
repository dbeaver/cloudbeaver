/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { MenuBarSmallItem, Table, TableBody, TableColumnHeader, TableHeader, useStyles, useTranslate } from '@cloudbeaver/core-blocks';

import type { ILogEntry } from './ILogEntry';
import { LogEntry } from './LogEntry';

const styles = css`
  wrapper {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  Table {
    flex: 1 1 auto;
    width: 100%;
  }
  table-wrapper {
    overflow: auto;
  }
  message-title-box {
    display: flex;
    align-items: center;

    & message-title {
      flex: 1;
    }
  }
  [|buttons] {
    text-align: right;
  }
  TableColumnHeader {
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  TableColumnHeader[min] {
    width: 32px;
  }
  [|timestamp] {
    width: 100px;
    min-width: 100px;
  }
`;

interface Props {
  items: ILogEntry[];
  selectedItem: ILogEntry | null;
  onItemSelect: (item: ILogEntry) => void;
  onClear: () => void;
  className?: string;
}
export const LogViewerTable = observer<Props>(function LogViewerTable({ items, selectedItem, onItemSelect, onClear, className }) {
  const translate = useTranslate();
  const style = useStyles(styles);

  return styled(style)(
    <wrapper className={className}>
      <table-wrapper>
        <Table {...use({ expanded: !!selectedItem })}>
          <TableHeader fixed>
            <TableColumnHeader min />
            <TableColumnHeader {...use({ timestamp: true })}>{translate('plugin_log_viewer_entry_timestamp')}</TableColumnHeader>
            <TableColumnHeader>
              <message-title-box>
                <message-title>{translate('plugin_log_viewer_entry_message')}</message-title>
                <MenuBarSmallItem icon="trash" viewBox="0 0 24 24" title={translate('plugin_log_viewer_clear_log')} onClick={onClear}>
                  {translate('ui_clear')}
                </MenuBarSmallItem>
              </message-title-box>
            </TableColumnHeader>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <LogEntry key={item.id} item={item} selected={item.id === selectedItem?.id} onSelect={onItemSelect} />
            ))}
          </TableBody>
        </Table>
      </table-wrapper>
    </wrapper>,
  );
});
