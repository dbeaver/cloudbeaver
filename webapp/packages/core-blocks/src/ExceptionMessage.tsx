/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { Button } from './Button';
import { Icon } from './Icon';
import { IconOrImage } from './IconOrImage';
import { useTranslate } from './localization/useTranslate';
import { useErrorDetails } from './useErrorDetails';
import { useStyles } from './useStyles';

const style = css`
  error {
    flex: 1;
    display: flex;
    padding: 24px;
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
    padding: 0;

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
  error[|icon] {
    padding: 0;
    height: 100%;
    width: 100%;
    max-height: 24px;
    max-width: 24px;
    
    & error-icon {
      display: flex;
      align-items: center;
      align-content: center;

      & IconOrImage {
        height: 100%;
        width: 100%;
      }
    }
  }
  error-action-close {
    cursor: pointer;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }
`;

interface Props {
  exception?: Error;
  icon?: boolean;
  inline?: boolean;
  className?: string;
  styles?: ComponentStyle;
  onRetry?: () => void;
  onClose?: () => void;
}

export const ExceptionMessage = observer<Props>(function ExceptionMessage({
  exception = null, icon, inline, className, styles, onRetry, onClose,
}) {
  const translate = useTranslate();
  const error = useErrorDetails(exception);

  if (error.refresh) {
    const retry = onRetry;
    const refresh = error.refresh;
    onRetry = () => {
      retry?.();
      refresh();
    };
  }

  return styled(useStyles(style, styles))(
    <error {...use({ inline, icon })} className={className}>
      <error-icon title={error.message}>
        <IconOrImage icon={(inline || icon) ? '/icons/error_icon_sm.svg' : '/icons/error_icon.svg'} />
      </error-icon>
      {!icon && (
        <>
          <error-data>
            <error-name>
              <span>{translate('core_blocks_exception_message_error_title')}</span>
            </error-name>
            <error-message>{translate('core_blocks_exception_message_error_message')} {onRetry && translate('ui_please_retry')}</error-message>
            <error-actions>
              <Button type='button' mod={['outlined']} disabled={error.isOpen} onClick={error.open}>
                {translate('ui_errors_details')}
              </Button>
              {onRetry && (
                <Button type='button' mod={['unelevated']} onClick={onRetry}>
                  {translate('ui_processing_retry')}
                </Button>
              )}
            </error-actions>
          </error-data>
          {onClose && (
            <error-action-close>
              <Icon name="cross" viewBox="0 0 16 16" onClick={onClose} />
            </error-action-close>
          )}
        </>
      )}
    </error>
  );
});
