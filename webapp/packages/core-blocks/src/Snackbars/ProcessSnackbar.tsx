/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { INotificationProcessExtraProps, ENotificationType, NotificationComponent } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';

import { Button } from '../Button';
import { useErrorDetails } from '../useErrorDetails';
import { useStateDelay } from '../useStateDelay';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper';
interface Props extends INotificationProcessExtraProps {
  closeDelay?: number;
  displayDelay?: number;
}

export const ProcessSnackbar: NotificationComponent<Props> = observer(function ProcessSnackbar({
  closeDelay = 3000,
  displayDelay = 750,
  notification,
  state,
}) {
  const { error, title, message, status } = state!;

  const translate = useTranslate();
  const details = useErrorDetails(error);
  const displayed = useStateDelay(notification.state.deleteDelay === 0, displayDelay);

  useStateDelay(status === ENotificationType.Success, closeDelay, notification.close);

  if (!displayed) {
    return null;
  }

  return (
    <SnackbarWrapper
      closing={!!notification.state.deleteDelay}
      unclosable={status === ENotificationType.Loading}
      onClose={() => notification.close(false)}
    >
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>
          {message && translate(message)}
        </SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          {error && (
            <Button
              type="button"
              mod={['outlined']}
              disabled={details.isOpen}
              onClick={details.open}
            >
              {translate('ui_errors_details')}
            </Button>
          )}
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
