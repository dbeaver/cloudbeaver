/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import { Button } from './Button';
import { useErrorDetails } from './useErrorDetails';

const styles = css`
  error {
    flex: 1;
    padding: 8px 24px;
  }

  error-name {
    composes: theme-typography--headline6 from global;
  }

  error-name, error-message {
    padding: 8px 24px;
    overflow: auto;
    white-space: pre-wrap;
  }

  error-actions {
    padding: 8px 24px
  }

  Button:not(:first-child) {
    margin-left: 24px;
  }
`;

interface Props {
  name?: string;
  message?: string;
  exception?: Error;
  onRetry?: () => void;
}

export const ExceptionMessage: React.FC<Props> = observer(function ExceptionMessage({
  name, message, exception = null, onRetry,
}) {
  const translate = useTranslate();
  const error = useErrorDetails(exception);

  return styled(styles)(
    <error as="div">
      <error-name as='div'>{name || error.details?.name}</error-name>
      <error-message as='div'>{message || error.details?.message}</error-message>
      <error-actions as='div'>
        {exception && (
          <Button type='button' mod={['outlined']} disabled={error.isOpen} onClick={error.open}>
            {translate('ui_errors_details')}
          </Button>
        )}
        {onRetry && (
          <Button type='button' mod={['unelevated']} onClick={onRetry}>
            {translate('ui_processing_retry')}
          </Button>
        )}
      </error-actions>
    </error>
  );
});
