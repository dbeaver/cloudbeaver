/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';

import { ENotificationType, type INotificationProcessExtraProps, type NotificationComponent } from '@cloudbeaver/core-events';

import { Button } from '../Button.js';
import { useTranslate } from '../localization/useTranslate.js';
import { useActivationDelay } from '../useActivationDelay.js';
import { useErrorDetails } from '../useErrorDetails.js';
import { useStateDelay } from '../useStateDelay.js';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody.js';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent.js';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter.js';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus.js';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper.js';

export interface ProcessSnackbarProps extends INotificationProcessExtraProps {
  closeDelay?: number;
  displayDelay?: number;
  onCancel?: () => void | Promise<void>;
}

export const ProcessSnackbar: NotificationComponent<ProcessSnackbarProps> = observer(function ProcessSnackbar({
  closeDelay = 3000,
  displayDelay = 750,
  notification,
  state,
  onCancel,
}) {
  const { error, title, message, status } = state!;

  const translate = useTranslate();
  const details = useErrorDetails(error);
  const [delayState, setDelayState] = useState(false);
  const displayedReal = notification.state.deleteDelay === 0;
  const displayed = useStateDelay(delayState, displayDelay);

  useEffect(() => {
    if (displayedReal) {
      setDelayState(true);
    }
  }, [displayedReal]);

  useActivationDelay(status === ENotificationType.Success, closeDelay, notification.close);

  if (!displayed) {
    return null;
  }

  return (
    <SnackbarWrapper
      closing={!!notification.state.deleteDelay}
      persistent={status === ENotificationType.Loading}
      onClose={() => notification.close(false)}
    >
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>{message && translate(message)}</SnackbarBody>
        <SnackbarFooter timestamp={notification.timestamp}>
          {details.hasDetails && (
            <Button type="button" variant="secondary" disabled={details.isOpen} onClick={details.open}>
              {translate('ui_errors_details')}
            </Button>
          )}

          {onCancel && status === ENotificationType.Loading && <Button onClick={onCancel}>{translate('ui_processing_cancel')}</Button>}
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
