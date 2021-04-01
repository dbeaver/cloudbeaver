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
import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import type { ILogEntry } from '../ILogEntry';
import { LogEntryController } from './LogEntryController';

export interface LogEntryProps {
  item: ILogEntry;
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
    &[|details] {
      cursor: pointer;
    }
  }

  tr:hover Icon {
    fill: #338fcc;
  }
`;

export const LogEntry = observer(function LogEntry({ item }: LogEntryProps) {
  const controller = useController(LogEntryController, item);
  const isDetails = !!item.stackTrace;

  return styled(useStyles(style))(
    <tr>
      <td>{item.type}</td>
      <td>{item.time}</td>
      <td>
        <message-cell as="div">
          <message as="div" onClick={isDetails ? controller.showDetails : undefined} {...use({ details: isDetails })}>
            {isDetails ? <Link>{item.message}</Link> : item.message}
          </message>
        </message-cell>
      </td>
    </tr>
  );
});
