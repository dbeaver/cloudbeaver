/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { BASE_TABLE_STYLES, Button } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ILogEntry } from './ILogEntry';
import { LogEntry } from './LogEntry';

const styles = css`
    icon, timestamp, message {
      composes: theme-border-color-background from global;
    }
    wrapper {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    table-wrapper {
      overflow: auto;
    }
    buttons {
      padding: 16px 
    }
    table {
      flex: 1 1 auto;
      width: 100%;
      table-layout: fixed;
    }
    tr {
      border-top: 1px solid;
    }
    icon, timestamp, message {
      box-sizing: border-box;
      white-space: nowrap;
      padding: 16px;
      height: 36px;
      padding-top: unset;
      padding-bottom: unset;
      text-transform: uppercase;
      text-align: left;
      text-decoration: none !important;
    }
    icon {
      width: 32px;
    }
    timestamp {
      width: 180px;
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
  const style = useStyles(BASE_TABLE_STYLES, styles);

  return styled(style)(
    <wrapper className={className}>
      <buttons>
        <Button mod={['unelevated']} onClick={onClear}>
          {translate('app_log_view_clear_log')}
        </Button>
      </buttons>
      <table-wrapper>
        <table {...use({ expanded: !!selectedItem })}>
          <thead>
            <tr>
              <icon as='th' />
              <timestamp as='th'>{translate('app_log_view_entry_timestamp')}</timestamp>
              <message as='th'>{translate('app_log_view_entry_message')}</message>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <LogEntry
                key={item.id}
                item={item}
                selected={item.id === selectedItem?.id}
                onSelect={onItemSelect}
              />
            ))}
          </tbody>
        </table>
      </table-wrapper>
    </wrapper>
  );
});
