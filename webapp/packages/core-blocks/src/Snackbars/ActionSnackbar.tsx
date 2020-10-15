/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useMemo, useState } from 'react';
import styled, { use } from 'reshadow';

import { Button, IconButton } from '@cloudbeaver/core-blocks';
import { NotificationComponentProps } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { NotificationMark } from './NotificationMark';
import { SNACKBAR_COMMON_STYLES } from './SnackbarCommonStyles';

type Props = NotificationComponentProps<{
  onAction: () => void;
  actionText: string;
}>;

export const ActionSnackbar: React.FC<Props> = function ActionSnackbar({
  notification, onAction, actionText,
}) {
  const styles = useStyles(SNACKBAR_COMMON_STYLES);
  const [mounted, setMounted] = useState(false);
  const translate = useTranslate();
  const timeStringFromTimestamp = notification.timestamp ? new Date(notification.timestamp).toLocaleTimeString() : '';
  const translatedTitle = useMemo(() => translate(notification.title), [notification.title, translate]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return styled(styles)(
    <notification as="div" {...use({ mounted })}>
      <NotificationMark type={notification.type} />
      <notification-body as="div">
        <body-text-block as='div'>
          <text-block-title title={translatedTitle} as='h2'>{translatedTitle}</text-block-title>
          {notification.message && <message as="div">{translate(notification.message)}</message>}
        </body-text-block>
        <notification-footer as='div'>
          <footer-time as='span'>{timeStringFromTimestamp}</footer-time>
          <actions as="div">
            <Button type="button" mod={['outlined']} onClick={onAction}>
              {translate(actionText)}
            </Button>
          </actions>
        </notification-footer>
      </notification-body>
      {!notification.persistent && (
        <IconButton name="cross" viewBox="0 0 16 16" onClick={notification.close} />
      )}
    </notification>

  );
};
