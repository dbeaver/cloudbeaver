/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ENotificationType } from '@cloudbeaver/core-events';

import { IconOrImage } from './IconOrImage';
import { Link } from './Link';
import { useTranslate } from './localization/useTranslate';
import { s } from './s';
import style from './StatusMessage.m.css';
import { useErrorDetails } from './useErrorDetails';
import { useS } from './useS';

interface Props {
  message?: string | string[] | null;
  status?: ENotificationType;
  exception?: Error | null;
  className?: string;
  onShowDetails?: () => void;
}

export const StatusMessage = observer<Props>(function StatusMessage({ status, message, exception = null, className, onShowDetails }) {
  const styles = useS(style);
  const translate = useTranslate();
  const errorDetails = useErrorDetails(exception);
  const isError = status === ENotificationType.Error || exception !== null;

  if (Array.isArray(message)) {
    message = message.map(m => translate(m)).join(', ');
  } else if (message !== null) {
    message = translate(message);
  }

  message = message ?? errorDetails.message;
  let icon = '/icons/info_icon.svg';

  if (isError) {
    icon = '/icons/error_icon.svg';
  } else if (status === ENotificationType.Success) {
    icon = '/icons/success_icon.svg';
  }

  if (errorDetails.hasDetails && !onShowDetails) {
    onShowDetails = errorDetails.open;
  }

  return (
    <div className={s(styles, { statusMessage: true }, className)}>
      {message && (
        <>
          <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} />
          <div className={s(styles, { message: true })} title={message}>
            {onShowDetails ? (
              <Link className={s(styles, { link: true })} onClick={onShowDetails}>
                {message}
              </Link>
            ) : (
              message
            )}
          </div>
        </>
      )}
    </div>
  );
});
