/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';
import styled, { use } from 'reshadow';

import { Button, IconButton } from '@cloudbeaver/core-blocks';
import { NotificationComponentProps } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { NotificationMark } from '@cloudbeaver/core-notifications';
import { useStyles } from '@cloudbeaver/core-theming';

import { SNACKBAR_COMMON_STYLES } from './SnackbarCommonStyles';

type ExtraProps = {
  onAction: () => void;
  actionText: string;
}

export const ActionSnackbar: React.FC<NotificationComponentProps & ExtraProps> = function ActionSnackbar({
  notification, onAction, actionText,
}) {
  const styles = useStyles(SNACKBAR_COMMON_STYLES);
  const [mounted, setMounted] = useState(false);
  const translate = useTranslate();

  useEffect(() => {
    setMounted(true);
  }, []);

  return styled(styles)(
    <notification as="div" {...use({ mounted })}>
      <notification-header as="div">
        <NotificationMark type={notification.type} />
        <message as="div">{translate(notification.title)}</message>
        {!notification.persistent && (
          <IconButton
            name="cross"
            viewBox="0 0 16 16"
            onClick={notification.close}
          />
        )}
      </notification-header>
      <notification-body as="div">
        <actions as="div">
          <Button type="button" mod={['outlined']} onClick={onAction}>
            {translate(actionText)}
          </Button>
        </actions>
      </notification-body>
    </notification>
  );
};
