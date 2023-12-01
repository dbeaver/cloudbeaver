/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Snackbar } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import type { INotification } from '@cloudbeaver/core-events';

import { NotificationItemController } from './NotificationItemController';

interface Props {
  notification: INotification<any>;
  className?: string;
}

export const NotificationsItem = observer<Props>(function Notification({ notification, className }) {
  const controller = useController(NotificationItemController, notification);

  if (notification.customComponent) {
    const Custom = notification.customComponent();
    return <Custom className={className} notification={notification} {...notification.extraProps} />;
  }

  return (
    <Snackbar
      className={className}
      title={notification.title}
      message={notification.message}
      persistent={notification.persistent}
      type={notification.type}
      time={notification.timestamp}
      state={notification.state}
      disableShowDetails={controller.isDetailsDialogOpen}
      closeDelay={controller.closeAfter}
      onClose={notification.close}
      onShowDetails={controller.handleShowDetails}
    />
  );
});
