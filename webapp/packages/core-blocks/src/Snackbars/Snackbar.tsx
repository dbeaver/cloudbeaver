/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { ENotificationType } from '@cloudbeaver/core-events';

import { Button } from '../Button';
import { Loader } from '../Loader/Loader';
import { useTranslate } from '../localization/useTranslate';
import { useActivationDelay } from '../useActivationDelay';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper';

interface SnackbarProps {
  type: ENotificationType;
  message?: string;
  title: string;
  persistent?: boolean;
  closeDelay: number;
  disableShowDetails?: boolean;
  time: number;
  onClose: (delayDeleting?: boolean) => void;
  state?: { deleteDelay: number };
  onShowDetails?: () => void;
}

export const Snackbar = observer<SnackbarProps>(function Snackbar({
  type,
  message,
  title,
  persistent,
  closeDelay = 0,
  disableShowDetails,
  onClose,
  onShowDetails,
  state,
  time,
}) {
  const translate = useTranslate();
  useActivationDelay(closeDelay > 0, closeDelay, onClose);

  return (
    <SnackbarWrapper closing={!!state?.deleteDelay} persistent={persistent} onClose={() => onClose(false)}>
      <Loader suspense>
        <SnackbarStatus status={type} />
        <SnackbarContent>
          <SnackbarBody title={translate(title)}>{message && translate(message)}</SnackbarBody>
          <SnackbarFooter timestamp={time}>
            {onShowDetails && (
              <Button type="button" mod={['outlined']} disabled={disableShowDetails} onClick={onShowDetails}>
                {translate('ui_errors_details')}
              </Button>
            )}
          </SnackbarFooter>
        </SnackbarContent>
      </Loader>
    </SnackbarWrapper>
  );
});
