/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ENotificationType } from '@cloudbeaver/core-events';


import { IconOrImage } from './IconOrImage';
import { Link } from './Link';
import { useTranslate } from './localization/useTranslate';
import { useErrorDetails } from './useErrorDetails';

const styles = css`
  status-message {
    overflow: hidden;
    composes: theme-typography--caption from global;
    height: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  IconOrImage {
    height: 24px;
    width: 24px;
  }
  message, Link {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  Link {
    cursor: pointer;
  }
`;

interface Props {
  message?: string | string[] | null;
  status?: ENotificationType;
  exception?: Error | null;
  onShowDetails?: () => void;
  className?: string;
}

export const StatusMessage = observer<Props>(function StatusMessage({
  status,
  message,
  exception = null,
  onShowDetails,
  className,
}) {
  const translate = useTranslate();
  const errorDetails = useErrorDetails(exception);

  if (Array.isArray(message)) {
    message = message.map(m => translate(m)).join(', ');
  } else if (message !== null) {
    message = translate(message);
  }

  message = message ?? errorDetails.details?.message;
  let icon = '/icons/info_icon.svg';

  if (status === ENotificationType.Error || exception !== null) {
    icon = '/icons/error_icon.svg';
  } else if (status === ENotificationType.Success) {
    icon = '/icons/success_icon.svg';
  }

  if (errorDetails.details?.hasDetails && !onShowDetails) {
    onShowDetails = errorDetails.open;
  }

  return styled(styles)(
    <status-message className={className}>
      {message && (
        <>
          <IconOrImage icon={icon} />
          <message title={message}>{onShowDetails ? <Link onClick={onShowDetails}>{message}</Link> : message}</message>
        </>
      )}
    </status-message>
  );
});
