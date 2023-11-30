/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, SnackbarBody, SnackbarContent, SnackbarFooter, SnackbarStatus, SnackbarWrapper, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationComponentProps } from '@cloudbeaver/core-events';
import { EDeferredState } from '@cloudbeaver/core-utils';

import { ExportNotificationController } from './ExportNotificationController';
import styles from './ExportNotification.m.css';

type Props = NotificationComponentProps<{
  source: string;
}>;

export const ExportNotification = observer<Props>(function ExportNotification({ notification }) {
  const controller = useController(ExportNotificationController, notification);
  const translate = useTranslate();
  const style = useS(styles);
  const { title, status, message } = controller.status;

  return (
    <SnackbarWrapper persistent={status === ENotificationType.Loading} onClose={controller.delete}>
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>
          {message && <message className={s(style, { message: true })}>{message}</message>}
          <source-name className={s(style, { 'source-name': true })}>
            {controller.sourceName}
            {controller.task?.context.query && (
              <pre 
                className={s(style, { pre: true })} 
                title={controller.task.context.query}
              >
                {controller.task.context.query}
              </pre>
            )}
          </source-name>
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          {status === ENotificationType.Info && controller.downloadUrl && (
            <>
              <Button type="button" mod={['outlined']} onClick={controller.delete}>
                {translate('data_transfer_notification_delete')}
              </Button>
              <Button tag="a" href={controller.downloadUrl} mod={['unelevated']} download onClick={controller.download}>
                {translate('data_transfer_notification_download')}
              </Button>
            </>
          )}
          {status === ENotificationType.Error && (
            <Button type="button" mod={['outlined']} disabled={controller.isDetailsDialogOpen} onClick={controller.showDetails}>
              {translate('ui_errors_details')}
            </Button>
          )}
          {status === ENotificationType.Loading && (
            <Button
              type="button"
              mod={['outlined']}
              disabled={controller.process?.getState() === EDeferredState.CANCELLING}
              onClick={controller.cancel}
            >
              {translate('ui_processing_cancel')}
            </Button>
          )}
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
