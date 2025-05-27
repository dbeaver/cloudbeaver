/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button } from './Button.js';
import style from './ExceptionMessage.module.css';
import { Icon } from './Icon.js';
import { IconOrImage } from './IconOrImage.js';
import { useTranslate } from './localization/useTranslate.js';
import { s } from './s.js';
import { useErrorDetails } from './useErrorDetails.js';
import { useS } from './useS.js';

interface Props {
  exception?: Error | null;
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

  if (!exception) {
    return null;
  }

  return (
    <div className={s(styles, { error: true, icon, inline }, className)}>
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
              {(error.hasDetails && error.message) || translate('core_blocks_exception_message_error_message')}{' '}
              {onRetry && translate('ui_please_retry')}
            </div>
            <div className={s(styles, { errorActions: true })}>
              <Button type="button" variant="secondary" disabled={error.isOpen} onClick={error.open}>
                {translate('ui_errors_details')}
              </Button>
              {onRetry && (
                <Button type="button" onClick={onRetry}>
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
