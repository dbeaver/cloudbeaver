/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { Link } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ILogEntry } from './ILogEntry';

export interface LogEntryProps {
  item: ILogEntry;
  onItemSelect: (error: ILogEntry | null) => void;
  selected?: boolean;
  className?: string;
}

const style = css`
  message-cell {
    display: flex;
    align-items: center;
  }
  message {
    word-break: break-word;
    white-space: nowrap;
    overflow: hidden;
    padding-right: 16px;
    text-overflow: ellipsis;
  }
  Link {
    overflow: hidden;
    text-overflow: ellipsis;
  }
  Link:hover {
    cursor: pointer;
  }
  tr[|selected] {
    font-weight: 500;
  }
`;

export const LogEntry = observer(function LogEntry({ item, onItemSelect, selected = false, className }: LogEntryProps) {
  return styled(useStyles(style))(
    <tr className={className} {...use({ selected, expanded: selected })}>
      <td>{item.type}</td>
      <td>{item.time}</td>
      <td>
        <message-cell as="div">
          <message as="div" title={item.message}>
            {item.stackTrace ? (
              <Link onClick={() => onItemSelect(selected ? null : item)}>
                {item.message}
              </Link>
            ) : item.message}
          </message>
        </message-cell>
      </td>
    </tr>
  );
});
