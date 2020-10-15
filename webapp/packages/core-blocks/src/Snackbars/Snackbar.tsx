/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useMemo, useState } from 'react';
import styled, { use } from 'reshadow';

import { Button, IconButton, SNACKBAR_COMMON_STYLES } from '@cloudbeaver/core-blocks';
import { ENotificationType } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { NotificationMark } from './NotificationMark';

interface SnackbarProps {
  type?: ENotificationType;
  message?: string;
  title: string;
  closeAfter?: number;
  disableShowDetails?: boolean;
  time?: number;
  onClose?: () => void;
  onShowDetails?: () => void;
}

export function Snackbar({
  type,
  message,
  title,
  closeAfter,
  disableShowDetails,
  onClose,
  onShowDetails,
  time,
}: SnackbarProps) {
  const styles = useStyles(SNACKBAR_COMMON_STYLES);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const translate = useTranslate();
  const timeStringFromTimestamp = time ? new Date(time).toLocaleTimeString() : '';
  const translatedTitle = translate(title);

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
      if (timeOutId) {
        clearTimeout(timeOutId);
      }
      if (timeOutClosingId) {
        clearTimeout(timeOutClosingId);
      }
    };
  }, []);

  return styled(styles)(
    <notification as="div" {...use({ mounted, closing })}>
      {type && <NotificationMark type={type} />}
      <notification-body as="div">
        <body-text-block as='div'>
          <text-block-title title={translatedTitle} as='h2'>{translatedTitle}</text-block-title>
          {message && <message as="div">{translate(message)}</message>}
        </body-text-block>
        <notification-footer as='div'>
          <footer-time as='span'>{timeStringFromTimestamp}</footer-time>
          {onShowDetails && (
            <actions as="div">
              <Button
                type="button"
                mod={['outlined']}
                disabled={disableShowDetails}
                onClick={onShowDetails}
              >
                {translate('ui_errors_details')}
              </Button>
            </actions>
          )}
        </notification-footer>
      </notification-body>
      {!closeAfter && onClose && (
        <IconButton name="cross" viewBox="0 0 16 16" onClick={onClose} />
      )}
    </notification>
  );
}
