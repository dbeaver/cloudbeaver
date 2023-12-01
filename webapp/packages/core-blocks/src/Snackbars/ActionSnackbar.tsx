/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { INotificationExtraProps, NotificationComponent } from '@cloudbeaver/core-events';

import { Button } from '../Button';
import { useTranslate } from '../localization/useTranslate';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper';

export interface ActionSnackbarProps extends INotificationExtraProps {
  onAction: () => void;
  actionText: string;
}

export const ActionSnackbar: NotificationComponent<ActionSnackbarProps> = observer(function ActionSnackbar({ notification, onAction, actionText }) {
  const translate = useTranslate();

  return (
    <SnackbarWrapper persistent={notification.persistent} onClose={() => notification.close(false)}>
      <SnackbarStatus status={notification.type} />
      <SnackbarContent>
        <SnackbarBody title={translate(notification.title)}>{notification.message && translate(notification.message)}</SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          <Button type="button" mod={['outlined']} onClick={onAction}>
            {translate(actionText)}
          </Button>
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
