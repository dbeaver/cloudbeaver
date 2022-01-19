/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import { Button } from './Button';
import { IconOrImage } from './IconOrImage';
import { useErrorDetails } from './useErrorDetails';

const styles = css`
  error {
    flex: 1;
    display: flex;
  }

  error-name {
    composes: theme-typography--headline6 from global;
    height: 40px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;

    & span {
      display: inline-block;
      vertical-align: middle;
      line-height: normal;
    }
  }

  error-data {
    padding: 0 16px;
  }

  error-message {
    flex: 1;
    overflow: auto;
    white-space: pre-wrap;
  }

  error-actions {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    margin-top: 16px;
    gap: 16px;
  }

  error[|inline] {
    align-items: center;
    height: 38px;

    & error-data {
      display: flex;
      align-items: center;
      padding: 0;
    }
    & error-icon {
      display: flex;
      align-items: center;
      align-content: center;

      & IconOrImage {
        height: 24px;
        width: 24px;
      }
    }
    & error-message {
      line-height: 1.2;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      overflow: hidden;
      padding: 0 16px;
    }
    & error-name {
      display: none;
    }
    & error-actions {
      margin-top: 0;
    }
  }
`;

interface Props {
  name?: string;
  message?: string;
  exception?: Error;
  inline?: boolean;
  className?: string;
  onRetry?: () => void;
}

export const ExceptionMessage = observer<Props>(function ExceptionMessage({
  name, message, exception = null, inline, className, onRetry,
}) {
  const translate = useTranslate();
  const error = useErrorDetails(exception);

  return styled(styles)(
    <error {...use({ inline })} className={className}>
      <error-icon><IconOrImage icon={inline ? '/icons/error_icon_sm.svg' : '/icons/error_icon.svg'} /></error-icon>
      <error-data>
        <error-name><span>{name || error.details?.name}</span></error-name>
        <error-message>{message || error.details?.message}</error-message>
        <error-actions>
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
      </error-data>
    </error>
  );
});
