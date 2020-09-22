/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { Button } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { LogEntry } from './LogEntry/LogEntry';
import { LogViewTabController } from './LogViewTabController';

const styles = css`
  wrapper {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column
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
  .type {
    width: 80px;
  }
  .timestamp {
    width: 180px;
  }
  .message {
    width: calc(100% - 260px);
  }
  
`;

export const LogViewTab = observer(function LogViewTab() {
  const style = useStyles(styles);
  const controller = useController(LogViewTabController);
  const translate = useTranslate();

  if (!controller.isActive) {
    return null;
  }

  return styled(style)(
    <wrapper as="div">
      <buttons as="div">
        <Button mod={['unelevated']} onClick={controller.clearLog}>
          {translate('app_log_view_clear_log')}
        </Button>
      </buttons>
      <table>
        <thead>
          <tr>
            <th className={styles.type}>{translate('app_log_view_entry_type')}</th>
            <th className={styles.timestamp}>{translate('app_log_view_entry_timestamp')}</th>
            <th className={styles.message}>{translate('app_log_view_entry_message')}</th>
          </tr>
        </thead>
        <tbody>
          {controller.log.map(item => <LogEntry key={item.id} item={item} />)}
        </tbody>
      </table>
    </wrapper>
  );
});
