/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { NotificationComponentProps, INotificationProcessExtraProps, ENotificationType } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';

import { SnackbarBody } from './SnackbarMarkups/SnackbarBody';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper';
import { useDelayToShowContent } from './useDelayToShowContent';
import { useErrorDetails } from './useErrorDetails';
import { useSnackbarTimeout } from './useSnackbarTimeout';

type IProcessSnackbarProps = NotificationComponentProps<INotificationProcessExtraProps & {
  closeAfter?: number;
  showContentDelay?: number;
}>;

export const ProcessSnackbar = observer(function ProcessSnackbar({
  closeAfter = 5000,
  showContentDelay = 750,
  notification,
  state,
  onClose,
}: IProcessSnackbarProps) {
  const translate = useTranslate();

  const { error, title, message, status } = state!;

  useSnackbarTimeout({ closeAfter, onClose, type: status });
  const { isDialogOpen, showErrorDetails } = useErrorDetails({ error });
  const isShowContent = useDelayToShowContent({
    deletingDelay: !!notification.state.deletingDelay,
    showContentDelay,
  });

  if (!isShowContent) {
    return null;
  }

  return (
    <SnackbarWrapper
      closing={!!notification.state.deletingDelay}
      closeable={status !== ENotificationType.Loading}
      onClose={() => onClose(false)}
    >
      <SnackbarStatus status={status} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)} message={message && translate(message)} />
        <SnackbarFooter
          disabled={isDialogOpen}
          timestamp={notification.timestamp}
          onShowDetails={showErrorDetails}
        />
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
