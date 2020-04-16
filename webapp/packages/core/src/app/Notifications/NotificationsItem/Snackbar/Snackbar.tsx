/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useEffect, useState } from 'react';
import { Button as ReakitButton } from 'reakit/Button';
import styled, { use } from 'reshadow';

import { Icon, Button } from '@dbeaver/core/blocks';
import { ENotificationType } from '@dbeaver/core/eventsLog';
import { useStyles } from '@dbeaver/core/theming';

import { NotificationMark } from './NotificationMark';
import { snackbarStyles } from './styles';

type SnackbarProps = {
  text: string;
  closeAfter?: number;
  type?: ENotificationType;
  disableShowDetails?: boolean;
  onClose?: () => void;
  onShowDetails?: () => void;
}

export const Snackbar = observer(function Snackbar(props: SnackbarProps) {
  const styles = useStyles(snackbarStyles);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const {
    closeAfter, onClose, onShowDetails, type, text,
  } = props;

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
    <notification
      as="div"
      {...use({
        mounted,
        closing,
      })}
    >
      <notification-header as="div">
        {type && <NotificationMark type={type} />}
        <message as="div">
          {text}
        </message>
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
              disabled={props.disableShowDetails}
            >
              Details
            </Button>
          </actions>
        )}
      </notification-body>
    </notification>
  );
});
