/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { Snackbar } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { INotification } from '@cloudbeaver/core-events';

import { NotificationItemController } from './NotificationItemController';

interface Props {
  notification: INotification<any>;
}

export const NotificationsItem = observer(function Notification({ notification }: Props) {
  const controller = useController(NotificationItemController, notification);

  if (notification.customComponent) {
    const Custom = notification.customComponent();
    return <Custom notification={notification} onClose={controller.handleClose} {...notification.extraProps} />;
  }

  return (
    <Snackbar
      title={notification.title}
      message={notification.message}
      type={notification.type}
      time={notification.timestamp}
      disableShowDetails={controller.isDetailsDialogOpen}
      closeAfter={controller.closeAfter}
      onClose={controller.handleClose}
      onShowDetails={controller.handleShowDetails}
    />
  );
});
