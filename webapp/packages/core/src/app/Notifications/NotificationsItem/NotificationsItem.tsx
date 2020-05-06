/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useController, useService } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { NotificationItemController } from './NotificationItemController';
import { Snackbar } from './Snackbar/Snackbar';

type NotificationProps = {
  notificationId: number;
}

export const NotificationsItem = observer(function Notification({ notificationId }: NotificationProps) {
  const notificationService = useService(NotificationService);
  const notification = notificationService.notificationList.get(notificationId);
  if (!notification || notification.isSilent) {
    return null;
  }
  const controller = useController(NotificationItemController, notification);

  if (notification.customComponent) {
    const Custom = notification.customComponent();
    return <Custom notification={notification} onClose={controller.handleClose} />;
  }

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
