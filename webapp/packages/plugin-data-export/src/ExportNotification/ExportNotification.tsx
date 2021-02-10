/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  Button, SnackbarWrapper, SnackbarStatus, SnackbarContent, SnackbarBody, SnackbarFooter
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationComponentProps } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { EDeferredState } from '@cloudbeaver/core-utils';

import { ExportNotificationController } from './ExportNotificationController';

const styles = css`
  source-name {
    composes: theme-typography--body2 from global;
    padding-top: 16px;
    max-height: 50px;
    overflow: hidden;

    & pre {
      margin: 0;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }
`;

type Props = NotificationComponentProps<{
  source: string;
}>;

export const ExportNotification: React.FC<Props> = observer(function ExportNotification({
  notification,
}) {
  const controller = useController(ExportNotificationController, notification);
  const translate = useTranslate();
  const { title, status } = controller.status;

  return styled(useStyles(styles))(
    <SnackbarWrapper unclosable={status === ENotificationType.Loading} onClose={controller.delete}>
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>
          <source-name as="div">
            {controller.sourceName}
            {controller.task?.context.sourceName && (
              <pre title={controller.task.context.sourceName}>
                {controller.task.context.sourceName}
              </pre>
            )}
          </source-name>
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          {status === ENotificationType.Info && (
            <>
              <Button
                type="button"
                mod={['outlined']}
                onClick={controller.delete}
              >
                {translate('data_transfer_notification_delete')}
              </Button>
              <Button
                tag='a'
                href={controller.downloadUrl}
                mod={['unelevated']}
                download
                onClick={controller.download}
              >
                {translate('data_transfer_notification_download')}
              </Button>
            </>
          )}
          {status === ENotificationType.Error && (
            <Button
              type="button"
              mod={['outlined']}
              disabled={controller.isDetailsDialogOpen}
              onClick={controller.showDetails}
            >
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
