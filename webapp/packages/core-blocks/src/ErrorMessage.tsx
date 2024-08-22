/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button } from './Button';
import styles from './ErrorMessage.module.css';
import { IconOrImage } from './IconOrImage';
import { useTranslate } from './localization/useTranslate';
import { s } from './s';
import { useS } from './useS';

interface Props {
  hasDetails?: boolean;
  text: string;
  className?: string;
  onShowDetails?: () => void;
}

export const ErrorMessage = observer<Props>(function ErrorMessage({ text, className, hasDetails, onShowDetails }) {
  const translate = useTranslate();
  const style = useS(styles);

  return (
    <div role="status" tabIndex={0} aria-label={text} className={s(style, { message: true }, className)}>
      <IconOrImage className={s(style, { errorIcon: true })} icon="/icons/error_icon_sm.svg" />
      <div className={s(style, { messageBody: true })} title={text}>
        {text}
      </div>
      <div className={s(style, { messageActions: true })}>
        {hasDetails && (
          <Button type="button" mod={['outlined']} onClick={onShowDetails}>
            {translate('ui_errors_details')}
          </Button>
        )}
      </div>
    </div>
  );
});
