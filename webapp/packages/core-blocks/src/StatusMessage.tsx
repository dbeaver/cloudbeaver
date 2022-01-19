/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { IconOrImage, Link } from '@cloudbeaver/core-blocks';
import { ENotificationType } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';

interface Props {
  message: string | undefined | null;
  status: ENotificationType | undefined;
  onShowDetails?: () => void;
  className?: string;
}

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

export const StatusMessage = observer<Props>(function StatusMessage({ status, message, onShowDetails, className }) {
  const translate = useTranslate();
  message = message ? translate(message) : message;
  let icon = '/icons/info_icon.svg';

  if (status === ENotificationType.Error) {
    icon = '/icons/error_icon.svg';
  } else if (status === ENotificationType.Success) {
    icon = '/icons/success_icon.svg';
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
