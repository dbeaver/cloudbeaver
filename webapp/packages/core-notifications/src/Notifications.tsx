/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Portal } from 'reakit';

import { s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import styles from './Notifications.module.css';
import { NotificationsItem } from './NotificationsItem/NotificationsItem.js';

export const Notifications = observer(function Notifications() {
  const notificationService = useService(NotificationService);
  const style = useS(styles);

  return (
    <Portal>
      <div className={s(style, { notifications: true })}>
        {notificationService.visibleNotifications.map(notification => (
          <NotificationsItem key={notification.id} notification={notification} />
        ))}
      </div>
    </Portal>
  );
});
