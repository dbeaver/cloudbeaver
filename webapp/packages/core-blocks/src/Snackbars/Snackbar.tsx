/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { ENotificationType } from '@cloudbeaver/core-events';

import { Button } from '../Button.js';
import { Loader } from '../Loader/Loader.js';
import { useTranslate } from '../localization/useTranslate.js';
import { useActivationDelay } from '../useActivationDelay.js';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody.js';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent.js';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter.js';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus.js';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper.js';

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
              <Button type="button" variant="secondary" disabled={disableShowDetails} onClick={onShowDetails}>
                {translate('ui_errors_details')}
              </Button>
            )}
          </SnackbarFooter>
        </SnackbarContent>
      </Loader>
    </SnackbarWrapper>
  );
});
