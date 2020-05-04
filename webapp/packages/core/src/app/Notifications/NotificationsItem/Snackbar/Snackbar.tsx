/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useState } from 'react';
import { Button as ReakitButton } from 'reakit/Button';
import styled, { use } from 'reshadow';

import { Icon, Button } from '@dbeaver/core/blocks';
import { ENotificationType } from '@dbeaver/core/eventsLog';
import { useStyles } from '@dbeaver/core/theming';

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
        <message as="div">{text}</message>
        {!closeAfter && onClose && (
          <ReakitButton onClick={onClose}>
            <Icon name="cross" viewBox="0 0 16 16" />
          </ReakitButton>
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
              Details
            </Button>
          </actions>
        )}
      </notification-body>
    </notification>
  );
}
