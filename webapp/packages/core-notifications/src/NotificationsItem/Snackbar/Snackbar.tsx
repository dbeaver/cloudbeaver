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
import { ENotificationType } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { NotificationMark } from './NotificationMark';
import { SNACKBAR_STYLES } from './styles';

type SnackbarProps = {
  type?: ENotificationType;
  text: string;
  closeAfter?: number;
  disableShowDetails?: boolean;
  onClose?: () => void;
  onShowDetails?: () => void;
}

export function Snackbar({
  type,
  text,
  closeAfter,
  disableShowDetails,
  onClose,
  onShowDetails,
}: SnackbarProps) {
  const styles = useStyles(SNACKBAR_STYLES);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const translate = useTranslate();

  useEffect(() => {
    setMounted(true);
    let timeOutId: any;
    let timeOutClosingId: any;

    if (closeAfter) {
      timeOutId = setTimeout(() => {
        setClosing(true);

        if (onClose) {
          timeOutClosingId = setTimeout(onClose, 1000);
        }
      }, closeAfter);
    }
    return () => {
      if (timeOutId) { clearTimeout(timeOutId); }
      if (timeOutClosingId) { clearTimeout(timeOutClosingId); }
    };
  }, []);

  return styled(styles)(
    <notification as="div" {...use({ mounted, closing })} >
      <notification-header as="div">
        {type && <NotificationMark type={type} />}
        <message as="div">{translate(text)}</message>
        {!closeAfter && onClose && (
          <IconButton onClick={onClose} name="cross" viewBox="0 0 16 16" />
        )}
      </notification-header>
      <notification-body as="div">
        {onShowDetails && (
          <actions as="div">
            <Button
              type="button"
              mod={['outlined']}
              onClick={onShowDetails}
              disabled={disableShowDetails}
            >
              {translate('ui_errors_details')}
            </Button>
          </actions>
        )}
      </notification-body>
    </notification>
  );
}
