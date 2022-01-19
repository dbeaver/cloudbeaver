/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { Button } from '@cloudbeaver/core-blocks';
import type { ENotificationType } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';

import { useStateDelay } from '../useStateDelay';
import { SnackbarBody } from './SnackbarMarkups/SnackbarBody';
import { SnackbarContent } from './SnackbarMarkups/SnackbarContent';
import { SnackbarFooter } from './SnackbarMarkups/SnackbarFooter';
import { SnackbarStatus } from './SnackbarMarkups/SnackbarStatus';
import { SnackbarWrapper } from './SnackbarMarkups/SnackbarWrapper';

interface SnackbarProps {
  type: ENotificationType;
  message?: string;
  title: string;
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
  closeDelay = 0,
  disableShowDetails,
  onClose,
  onShowDetails,
  state,
  time,
}) {
  const translate = useTranslate();
  useStateDelay(closeDelay > 0, closeDelay, onClose);

  return (
    <SnackbarWrapper closing={!!state?.deleteDelay} onClose={() => onClose(false)}>
      <SnackbarStatus status={type} />
      <SnackbarContent>
        <SnackbarBody title={translate(title)}>
          {message && translate(message)}
        </SnackbarBody>
        <SnackbarFooter timestamp={time}>
          {onShowDetails && (
            <Button
              type="button"
              mod={['outlined']}
              disabled={disableShowDetails}
              onClick={onShowDetails}
            >
              {translate('ui_errors_details')}
            </Button>
          )}
        </SnackbarFooter>
      </SnackbarContent>
    </SnackbarWrapper>
  );
});
