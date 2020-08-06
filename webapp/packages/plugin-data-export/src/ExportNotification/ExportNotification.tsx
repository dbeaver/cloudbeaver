/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import styled, { use, css } from 'reshadow';

import { Button, Loader, IconButton } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { NotificationComponentProps } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { SNACKBAR_STYLES } from '@cloudbeaver/core-notifications';
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
  IconButton {
    color: rgba(0, 0, 0, 0.45);
  }
`;

export const ExportNotification = observer(function ExportNotification({
  notification,
}: NotificationComponentProps<string>) {
  const controller = useController(ExportNotificationController, notification);
  const translate = useTranslate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return styled(useStyles(SNACKBAR_STYLES, styles))(
    <notification as="div" {...use({ mounted })} >
      <notification-header as="div">
        <Loader loading={controller.isPending} hideMessage />
        <message as="div">{translate(controller.status)}</message>
        {!controller.isPending && (
          <IconButton onClick={controller.delete} name="cross" viewBox="0 0 16 16" />
        )}
      </notification-header>
      <notification-body as="div">
        <source-name as="div">
          {controller.sourceName}
          <pre title={controller.task?.context.sourceName}>{controller.task?.context.sourceName}</pre>
        </source-name>
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
                onClick={controller.download}
                download
              >
                {translate('data_transfer_notification_download')}
              </Button>
            </>
          )}
          {controller.hasDetails && (
            <Button
              type="button"
              mod={['outlined']}
              onClick={controller.showDetails}
              disabled={controller.isDetailsDialogOpen}
            >
              {translate('ui_errors_details')}
            </Button>
          )}
          {controller.isPending && (
            <Button
              type="button"
              mod={['outlined']}
              onClick={controller.cancel}
              disabled={controller.process?.getState() === EDeferredState.CANCELLING}
            >
              {translate('ui_processing_cancel')}
            </Button>
          )}
        </actions>
      </notification-body>
    </notification>
  );
});
