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
  useErrorDetails,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ENotificationType } from '@cloudbeaver/core-events';
import { EDeferredState } from '@cloudbeaver/core-utils';

import styles from './ExportNotification.module.css';
import type { IExportNotification } from './IExportNotification.js';
import { useExportNotification } from './useExportNotification.js';

interface Props {
  notification: IExportNotification;
}

export const ExportNotification = observer<Props>(function ExportNotification({ notification }) {
  const translate = useTranslate();
  const style = useS(styles);
  const state = useExportNotification(notification);
  const errorDetails = useErrorDetails(state.task?.process.getRejectionReason() ?? null);

  const { title, status, message } = state.status;

  return (
    <SnackbarWrapper persistent={status === ENotificationType.Loading} onClose={state.delete}>
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>
          {message && <div className={s(style, { message: true })}>{message}</div>}
          <div className={s(style, { sourceName: true })}>
            {state.sourceName}
            {state.task?.context.query && (
              <pre className={s(style, { pre: true })} title={state.task.context.query}>
                {state.task.context.query}
              </pre>
            )}
          </div>
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          {status === ENotificationType.Info && state.downloadUrl && (
            <>
              <Button type="button" mod={['outlined']} onClick={state.delete}>
                {translate('ui_processing_cancel')}
              </Button>
              <Button tag="a" href={state.downloadUrl} mod={['unelevated']} download onClick={state.download}>
                {translate('data_transfer_notification_download')}
              </Button>
            </>
          )}
          {status === ENotificationType.Error && (
            <Button type="button" mod={['outlined']} disabled={errorDetails.isOpen} onClick={errorDetails.open}>
              {translate('ui_errors_details')}
            </Button>
          )}
          {status === ENotificationType.Loading && (
            <Button type="button" mod={['outlined']} disabled={state.task?.process.getState() === EDeferredState.CANCELLING} onClick={state.cancel}>
              {translate('ui_processing_cancel')}
            </Button>
          )}
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
