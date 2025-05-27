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
  Text,
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
  const isReadyToDownload = status === ENotificationType.Info && !!state.downloadUrl;

  return (
    <SnackbarWrapper persistent={status === ENotificationType.Loading} onClose={state.delete}>
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>
          {isReadyToDownload && <Text className={s(style, { subText: true })}>{translate('plugin_data_export_download_process_info')}</Text>}
          {message && <div className={s(style, { message: true })}>{message}</div>}
          <div className={s(style, { subText: true, sourceName: true })}>
            {state.sourceName}
            {state.task?.context.query && (
              <pre className={s(style, { pre: true })} title={state.task.context.query}>
                {state.task.context.query}
              </pre>
            )}
          </div>
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          {isReadyToDownload && (
            <div className="tw:flex tw:gap-4 tw:p-1">
              <Button type="button" variant="secondary" onClick={state.delete}>
                {translate('ui_processing_cancel')}
              </Button>
              <Button className="tw:flex tw:text-(--theme-on-primary)!" tag="a" href={state.downloadUrl} download onClick={state.download}>
                {translate('data_transfer_notification_download')}
              </Button>
            </div>
          )}
          {status === ENotificationType.Error && (
            <Button type="button" variant="secondary" disabled={errorDetails.isOpen} onClick={errorDetails.open}>
              {translate('ui_errors_details')}
            </Button>
          )}
          {status === ENotificationType.Loading && (
            <Button type="button" variant="secondary" disabled={state.task?.process.getState() === EDeferredState.CANCELLING} onClick={state.cancel}>
              {translate('ui_processing_cancel')}
            </Button>
          )}
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
