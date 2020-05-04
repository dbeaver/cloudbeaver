/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useEffect, useState, useCallback
} from 'react';
import { Button as ReakitButton } from 'reakit/Button';
import styled, { use, css } from 'reshadow';

import { SNACKBAR_STYLES } from '@dbeaver/core/app';
import { Icon, Button, Loader } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { NotificationComponentProps } from '@dbeaver/core/eventsLog';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles } from '@dbeaver/core/theming';
import { EDeferredState } from '@dbeaver/core/utils';

import { DataExportService } from './DataExportService';

const styles = css`
  Loader {
    margin-right: 16px;
  }
  actions {
    display: flex;
  }
  fill {
    flex: 1;
  }
  Button {
    margin-left: 16px !important;
  }
  actions Button {
    display: flex;
  }
`;

export const PendingNotification = observer(function PendingNotification({
  notification,
  onClose,
}: NotificationComponentProps<string>) {
  const translate = useTranslate();
  const dataExportService = useService(DataExportService);
  const task = dataExportService.exportProcesses.get(notification.source);
  if (!task) {
    return null;
  }
  const [mounted, setMounted] = useState(false);
  const [idDetailsOpen, setDetails] = useState(false);

  const getDownloadUrl = useCallback(
    () => dataExportService.downloadUrl(notification.source),
    [dataExportService, notification]
  );

  const handleDelete = useCallback(() => {
    dataExportService.delete(notification.source);
    onClose();
  }, [dataExportService, notification, onClose]);

  const handleDownload = useCallback(() => {
    dataExportService.download(notification.source);
    onClose();
  }, [dataExportService, notification, onClose]);

  const handleCancel = useCallback(() => {
    dataExportService.cancel(notification.source);
  }, [dataExportService, notification]);

  const handleDetails = useCallback(async () => {
    try {
      setDetails(true);
      await dataExportService.showDetails(notification.source);
    } finally {
      setDetails(false);
    }
  }, [dataExportService, notification]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const status = useCallback(() => {
    switch (task.getState()) {
      case EDeferredState.PENDING:
        return translate('data_transfer_notification_preparation');
      case EDeferredState.CANCELLING:
        return translate('ui_processing_canceling');
      case EDeferredState.RESOLVED:
        return translate('data_transfer_notification_ready');
      default:
        return translate('data_transfer_notification_error');
    }
  }, [task]);

  const isSuccess = task.getState() === EDeferredState.RESOLVED;

  return styled(useStyles(SNACKBAR_STYLES, styles))(
    <notification as="div" {...use({ mounted })} >
      <notification-header as="div">
        <Loader loading={task.isInProgress} hideMessage />
        <message as="div">{status()}</message>
        {task.isFinished && (
          <ReakitButton onClick={handleDelete}>
            <Icon name="cross" viewBox="0 0 16 16" />
          </ReakitButton>
        )}
      </notification-header>
      <notification-body as="div">
        <actions as="div">
          <fill as="div" />
          {task.isFinished && isSuccess && (
            <>
              <Button
                type="button"
                mod={['outlined']}
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button
                type="button"
                tag='a'
                href={getDownloadUrl()}
                mod={['unelevated']}
                onClick={handleDownload}
                download
              >
                Download
              </Button>
            </>
          )}
          {task.isFinished && !isSuccess && task.getRejectionReason() && (
            <Button
              type="button"
              mod={['outlined']}
              onClick={handleDetails}
              disabled={idDetailsOpen}
            >
              {translate('ui_errors_details')}
            </Button>
          )}
          {!task.isFinished && (
            <Button
              type="button"
              mod={['outlined']}
              onClick={handleCancel}
              disabled={task.getState() === EDeferredState.CANCELLING}
            >
              {translate('ui_processing_cancel')}
            </Button>
          )}
        </actions>
      </notification-body>
    </notification>
  );
});
