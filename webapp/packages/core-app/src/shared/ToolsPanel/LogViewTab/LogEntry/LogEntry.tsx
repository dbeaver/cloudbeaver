/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { ILogEntry } from '../ILogEntry';
import { LogEntryController } from './LogEntryController';

export type LogEntryProps = {
  item: ILogEntry;
};

const style = css`
  message-cell {
    display: flex;
    align-items: center;
  }
  message {
    flex: 1;
    word-break: break-word;
    white-space: nowrap;
    overflow: hidden;
    padding-right: 16px;
    text-overflow: ellipsis;
  }
  
  snack {
    display: flex;
    cursor: pointer;
  }
      
  snack Icon {
    display: block;
    width: 16px;
    height: 10px;
    fill: rgba(255, 255, 255, 0);
  }

  tr:hover Icon {
    fill: #338fcc;
  }
`;

export const LogEntry = observer(function LogEntry({ item }: LogEntryProps) {
  const controller = useController(LogEntryController, item);

  return styled(useStyles(style))(
    <tr>
      <td>{item.type}</td>
      <td>{item.time}</td>
      <td>
        <message-cell as="div">
          <message as="div">
            {item.message}
          </message>
          <snack as="div" onClick={controller.showDetails}>
            <Icon name="snack" viewBox="0 0 16 10" />
          </snack>
        </message-cell>
      </td>
    </tr>
  );
});
