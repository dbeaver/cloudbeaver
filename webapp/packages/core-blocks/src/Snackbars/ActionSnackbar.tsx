/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { INotificationExtraProps, NotificationComponent } from '@cloudbeaver/core-events';

import { Button } from '../Button.js';
import { useTranslate } from '../localization/useTranslate.js';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody.js';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent.js';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter.js';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus.js';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper.js';

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
          <Button type="button" variant="secondary" onClick={onAction}>
            {translate(actionText)}
          </Button>
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
