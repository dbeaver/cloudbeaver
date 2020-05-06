/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { Portal } from 'reakit';
import styled, { css } from 'reshadow';

import { useService } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { useStyles } from '@dbeaver/core/theming';

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
        {notificationService.notificationList.keys.map(notificationId => (
          <NotificationsItem key={notificationId} notificationId={notificationId} />
        ))}
      </notifications>
    </Portal>
  );
});
