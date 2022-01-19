/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Portal } from 'reakit/Portal';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { useStyles } from '@cloudbeaver/core-theming';

import { NotificationsItem } from './NotificationsItem/NotificationsItem';

const styles = css`
    notifications {
      composes: theme-typography from global;
      position: absolute;
      bottom:0;
      left: 0;
      z-index: 1000; /* modal dialogs is 999, but more correct way is place notifications after dialogs in the dom */
    }
 `;

export const Notifications = observer(function Notifications() {
  const notificationService = useService(NotificationService);

  return styled(useStyles(styles))(
    <Portal>
      <notifications as="div">
        {notificationService.visibleNotifications.map(notification => (
          <NotificationsItem key={notification.id} notification={notification} />
        ))}
      </notifications>
    </Portal>
  );
});
