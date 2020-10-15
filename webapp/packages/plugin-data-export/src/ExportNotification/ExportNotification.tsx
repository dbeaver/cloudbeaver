/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useEffect, useMemo, useState } from 'react';
import styled, { use, css } from 'reshadow';

import {
  Button, Loader, IconButton, SNACKBAR_COMMON_STYLES, NotificationMark
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { ENotificationType, NotificationComponentProps } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { EDeferredState } from '@cloudbeaver/core-utils';

import { ExportNotificationController } from './ExportNotificationController';

const styles = css`
  Loader {
    margin-right: 16px;
  }
  source-name {
    composes: theme-typography--body2 from global;
    padding-top: 16px;
    max-height: 50px;
    overflow: hidden;

    & pre {
      margin: 0;
    }
  }
  loader-container {
    & Loader {
      width: 35px;
      height: 40px;
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
  const [mounted, setMounted] = useState(false);
  const timeStringFromTimestamp = notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString() : '';
  const exportNotificationType = controller.isSuccess ? ENotificationType.Info : ENotificationType.Error;
  const translatedStatus = useMemo(() => translate(controller.status), [controller.status, translate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return styled(useStyles(SNACKBAR_COMMON_STYLES, styles))(
    <notification as="div" {...use({ mounted })}>
      {!controller.isPending && <NotificationMark type={exportNotificationType} />}
      {controller.isPending && (
        <loader-container as='div'>
          <Loader fullSize hideMessage />
        </loader-container>
      )}
      <notification-body as="div">
        <body-text-block as='div'>
          <text-block-title title={translatedStatus} as="h2">{translatedStatus}</text-block-title>
          <message as="div">
            {controller.sourceName}
            {controller.task?.context.sourceName && (
              <pre title={controller.task?.context.sourceName}>
                {controller.task?.context.sourceName}
              </pre>
            )}
          </message>
        </body-text-block>
        <notification-footer as='div'>
          <footer-time as='span'>{timeStringFromTimestamp}</footer-time>
          <actions as="div">
            {controller.isSuccess && (
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
            {controller.hasDetails && (
              <Button
                type="button"
                mod={['outlined']}
                disabled={controller.isDetailsDialogOpen}
                onClick={controller.showDetails}
              >
                {translate('ui_errors_details')}
              </Button>
            )}
            {controller.isPending && (
              <Button
                type="button"
                mod={['outlined']}
                disabled={controller.process?.getState() === EDeferredState.CANCELLING}
                onClick={controller.cancel}
              >
                {translate('ui_processing_cancel')}
              </Button>
            )}
          </actions>
        </notification-footer>
      </notification-body>
      {!controller.isPending && (
        <IconButton name="cross" viewBox="0 0 16 16" onClick={controller.delete} />
      )}
    </notification>
  );
});
