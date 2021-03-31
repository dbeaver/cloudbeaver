/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useController } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

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
  }
  fill {
    flex: 1;
  }

  tr:hover Icon {
    fill: #338fcc;
  }
`;

const messageWithDetailsStyles = composes(
  css`
    message {
      composes: theme-text-primary from global;
    }
  `,
  css`
    message {
      cursor: pointer;
      &:hover {
        opacity: 0.8;
      }
    }
  `);

export const LogEntry = observer(function LogEntry({ item }: LogEntryProps) {
  const controller = useController(LogEntryController, item);

  return styled(useStyles(style, !!item.stackTrace && messageWithDetailsStyles))(
    <tr>
      <td>{item.type}</td>
      <td>{item.time}</td>
      <td>
        <message-cell as="div">
          <message as="div" onClick={item.stackTrace ? controller.showDetails : undefined}>
            {item.message}
          </message>
          <fill as='div' />
        </message-cell>
      </td>
    </tr>
  );
});
