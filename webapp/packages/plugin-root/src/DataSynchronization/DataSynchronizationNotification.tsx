/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  s,
  SnackbarBody,
  SnackbarContent,
  SnackbarFooter,
  SnackbarStatus,
  SnackbarWrapper,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ENotificationType, type NotificationComponentProps } from '@cloudbeaver/core-events';
import { DataSynchronizationService } from '@cloudbeaver/core-root';
import { groupBy, objectValues } from '@cloudbeaver/core-utils';

import styles from './DataSynchronizationNotification.module.css';
import { DataSynchronizationNotificationMessages } from './DataSynchronizationNotificationMessages.js';

export const DataSynchronizationNotification = observer<NotificationComponentProps>(function DataSynchronizationNotification({ notification }) {
  const dataSynchronizationService = useService(DataSynchronizationService);
  const translate = useTranslate();
  const groups = objectValues(groupBy(Array.from(dataSynchronizationService.queue.values()), message => message.label));
  const style = useS(styles);

  function applyChanges() {
    dataSynchronizationService.resolveAll(true);
    notification.close(false);
  }

  function ignoreChanges() {
    notification.close(false);
  }

  return (
    <SnackbarWrapper onClose={ignoreChanges}>
      <SnackbarStatus status={ENotificationType.Info} />
      <SnackbarContent>
        <SnackbarBody title={translate(notification.title)}>
          {notification.message && translate(notification.message)}
          <div className={s(style, { message: true })}>
            {groups.map((messages, index) => (
              <DataSynchronizationNotificationMessages key={index} messages={messages} />
            ))}
          </div>
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          <Button type="button" variant="secondary" onClick={ignoreChanges}>
            {translate('ui_ignore')}
          </Button>
          <Button type="button" onClick={applyChanges}>
            {translate('ui_apply')}
          </Button>
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
