/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useController } from '@dbeaver/core/di';
import { INotification } from '@dbeaver/core/eventsLog';

import { NotificationItemController } from './NotificationItemController';
import { Snackbar } from './Snackbar/Snackbar';

type NotificationProps = {
  notification: INotification;
}

export const NotificationsItem = observer(function Notification({ notification }: NotificationProps) {
  if (!notification) {
    return null;
  }
  const controller = useController(NotificationItemController, notification);

  return (
    <Snackbar
      text={notification.title}
      type={notification.type}
      disableShowDetails={controller.isDetailsDialogOpen}
      onClose={controller.handleClose}
      onShowDetails={controller.handleShowDetails}
      closeAfter={controller.closeAfter}
    />
  );
});
