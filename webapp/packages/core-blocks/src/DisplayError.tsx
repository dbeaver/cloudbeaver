/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type React from 'react';

import { ENotificationType } from '@cloudbeaver/core-events';

import { AppRefreshButton } from './AppRefreshButton.js';
import style from './DisplayError.module.css';
import { s } from './s.js';
import { NotificationMark } from './Snackbars/NotificationMark.js';
import { useS } from './useS.js';

interface Props {
  root?: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  className?: string;
  children?: React.ReactNode;
}

export const DisplayError = observer<Props>(function DisplayError({ root, children, error, errorInfo, className }) {
  const styles = useS(style);
  const stack = errorInfo?.componentStack || error?.stack;

  return (
    <div role="alert" tabIndex={0} className={s(styles, { error: true, root }, className)}>
      <div className={s(styles, { errorInnerBlock: true })}>
        <NotificationMark className={s(styles, { notificationMark: true })} type={ENotificationType.Error} />
        <p>Something went wrong.</p>
        {root && <AppRefreshButton />}
        {children}
        {error && (
          <div className={s(styles, { details: true })}>
            {error.toString()}
            {stack && <br />}
            {stack}
          </div>
        )}
      </div>
    </div>
  );
});
