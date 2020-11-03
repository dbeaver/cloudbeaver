/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import { Button } from '../../Button';

interface ISnackbarFooter {
  timestamp: number;
  onShowDetails?: () => void;
  disabled?: boolean;
  className?: string;
}

const SNACKBAR_FOOTER_STYLES = css`
  notification-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  footer-time {
    composes: theme-typography--caption from global;
    opacity: 0.7;
  }
`;

export const SnackbarFooter: React.FC<ISnackbarFooter> = observer(function SnackbarFooter(
  { timestamp, onShowDetails, disabled, className }) {
  const timeStringFromTimestamp = new Date(timestamp).toLocaleTimeString();
  const translate = useTranslate();

  return styled(SNACKBAR_FOOTER_STYLES)(
    <notification-footer as='div' className={className}>
      <footer-time as='span'>{timeStringFromTimestamp}</footer-time>
      {onShowDetails && (
        <actions as="div">
          <Button
            type="button"
            mod={['outlined']}
            disabled={disabled}
            onClick={onShowDetails}
          >
            {translate('ui_errors_details')}
          </Button>
        </actions>
      )}
    </notification-footer>
  );
});
