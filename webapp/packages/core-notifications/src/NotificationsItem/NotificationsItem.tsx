/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Snackbar, useErrorDetails } from '@cloudbeaver/core-blocks';
import { ENotificationType, type INotification } from '@cloudbeaver/core-events';

import { FADE_TIMEOUT } from './FADE_TIMEOUT.js';

interface Props {
  notification: INotification<any>;
}

export const NotificationsItem = observer<Props>(function Notification({ notification }) {
  const errorDetails = useErrorDetails(notification.details ?? null);

  if (notification.customComponent) {
    const Custom = notification.customComponent();
    return <Custom notification={notification} {...notification.extraProps} />;
  }

  let closeDelay = 0;

  if (notification.type !== ENotificationType.Error && !notification.persistent && notification.autoClose !== false) {
    closeDelay = FADE_TIMEOUT;
  }

  return (
    <Snackbar
      title={notification.title}
      message={notification.message}
      persistent={notification.persistent}
      type={notification.type}
      time={notification.timestamp}
      state={notification.state}
      disableShowDetails={errorDetails.isOpen}
      closeDelay={closeDelay}
      onClose={notification.close}
      onShowDetails={errorDetails.hasDetails ? errorDetails.open : undefined}
    />
  );
});
