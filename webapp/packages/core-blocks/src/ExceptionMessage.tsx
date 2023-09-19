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
import style from './ExceptionMessage.m.css';
import { Icon } from './Icon';
import { IconOrImage } from './IconOrImage';
import { useTranslate } from './localization/useTranslate';
import { s } from './s';
import { useErrorDetails } from './useErrorDetails';
import { useS } from './useS';
import { useStyles } from './useStyles';

const oldStyle = css`
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
  onRetry?: () => void;
  onClose?: () => void;
}

export const ExceptionMessage = observer<Props>(function ExceptionMessage({ exception = null, icon, inline, className, onRetry, onClose }) {
  const styles = useS(style);
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

  return (
    <div {...use({ inline, icon })} className={s(styles, { error: true, icon, inline }, className)}>
      <div className={s(styles, { errorIcon: true })} title={error.message}>
        <IconOrImage className={s(styles, { iconOrImage: true })} icon={inline || icon ? '/icons/error_icon_sm.svg' : '/icons/error_icon.svg'} />
      </div>
      {!icon && (
        <>
          <div className={s(styles, { errorData: true })}>
            <h2 className={s(styles, { errorName: true })}>
              <span>{translate('core_blocks_exception_message_error_title')}</span>
            </h2>
            <div className={s(styles, { errorMessage: true })}>
              {translate('core_blocks_exception_message_error_message')} {onRetry && translate('ui_please_retry')}
            </div>
            <div className={s(styles, { errorActions: true })}>
              <Button type="button" mod={['outlined']} disabled={error.isOpen} onClick={error.open}>
                {translate('ui_errors_details')}
              </Button>
              {onRetry && (
                <Button type="button" mod={['unelevated']} onClick={onRetry}>
                  {translate('ui_processing_retry')}
                </Button>
              )}
            </div>
          </div>
          {onClose && (
            <div className={s(styles, { errorActionClose: true })}>
              <Icon name="cross" viewBox="0 0 16 16" onClick={onClose} />
            </div>
          )}
        </>
      )}
    </div>
  );
});
