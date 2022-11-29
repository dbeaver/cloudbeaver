/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  Button, SnackbarWrapper, SnackbarStatus, SnackbarContent, SnackbarBody, SnackbarFooter, useTranslate
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationComponentProps } from '@cloudbeaver/core-events';
import { DataSynchronizationService } from '@cloudbeaver/core-root';
import { groupBy, objectValues, uniq } from '@cloudbeaver/core-utils';

const styles = css`
  message {
    composes: theme-typography--caption from global;
    opacity: 0.8;
    overflow: auto;
    max-height: 100px;
    margin-top: 8px;

    display: flex;
    flex-direction: column;
    gap: 8px;

    &> div {
      word-break: break-word;
      white-space: pre-line;
    }

    &:empty {
      display: none;
    }
  }
`;

export const DataSynchronizationNotification = observer<NotificationComponentProps>(function DataSynchronizationNotification({
  notification,
}) {
  const dataSynchronizationService = useService(DataSynchronizationService);
  const translate = useTranslate();
  const groups = objectValues(groupBy(
    Array.from(dataSynchronizationService.queue.values()),
    message => message.label
  ));

  function applyChanges() {
    dataSynchronizationService.resolveAll(true);
    notification.close(false);
  }

  return styled(styles)(
    <SnackbarWrapper onClose={() => notification.close(false)}>
      <SnackbarStatus status={ENotificationType.Info} />
      <SnackbarContent>
        <SnackbarBody title={translate(notification.title)}>
          {notification.message && translate(notification.message)}
          <message>
            {groups.map(messages => {
              const message = uniq(messages.map(m => m.message)).join('\n');

              return <div key={messages[0].label}>{message}</div>;
            })}
          </message>
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          <Button type="button" mod={['outlined']} onClick={applyChanges}>
            {translate('ui_apply')}
          </Button>
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>

  );
});
