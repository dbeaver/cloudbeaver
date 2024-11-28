/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ENotificationType } from '@cloudbeaver/core-events';

import { IconOrImage } from './IconOrImage.js';
import { Link } from './Link.js';
import { useTranslate } from './localization/useTranslate.js';
import { s } from './s.js';
import style from './StatusMessage.module.css';
import { useErrorDetails } from './useErrorDetails.js';
import { useS } from './useS.js';

interface Props {
  message?: string | string[] | null;
  type?: ENotificationType | null;
  exception?: Error | null;
  className?: string;
  multipleRows?: boolean;
  onShowDetails?: () => void;
}

export const StatusMessage = observer<Props>(function StatusMessage({
  type,
  multipleRows = false,
  message,
  exception = null,
  className,
  onShowDetails,
}) {
  const styles = useS(style);
  const translate = useTranslate();
  const errorDetails = useErrorDetails(exception);
  const isError = type === ENotificationType.Error || exception !== null;

  function translateMessage(message: string | string[] | null | undefined) {
    if (Array.isArray(message)) {
      message = message.map(m => translate(m)).join(', ');
    } else if (message !== null) {
      message = translate(message);
    }

    return message;
  }

  message = translateMessage(message) || translateMessage(errorDetails.message);

  let icon = '/icons/info_icon.svg';

  if (isError) {
    icon = '/icons/error_icon.svg';
  } else if (type === ENotificationType.Success) {
    icon = '/icons/success_icon.svg';
  }

  if (errorDetails.hasDetails && !onShowDetails) {
    onShowDetails = errorDetails.open;
  }

  return (
    <div className={s(styles, { statusMessage: true, statusMessageExtended: !multipleRows }, className)}>
      {message && (
        <>
          <IconOrImage className={s(styles, { iconOrImage: true })} icon={icon} />
          <div className={s(styles, { message: !multipleRows })} title={message}>
            {onShowDetails ? (
              <Link className={s(styles, { link: !multipleRows })} onClick={onShowDetails}>
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
