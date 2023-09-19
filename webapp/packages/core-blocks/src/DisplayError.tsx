/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';
import styled, { css, use } from 'reshadow';

import { ENotificationType } from '@cloudbeaver/core-events';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { AppRefreshButton } from './AppRefreshButton';
import style from './DisplayError.m.css';
import { s } from './s';
import { NotificationMark } from './Snackbars/NotificationMark';
import { useS } from './useS';
import { useStyles } from './useStyles';

interface Props {
  root?: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  className?: string;
  styles?: ComponentStyle;
}

export const DisplayError: React.FC<React.PropsWithChildren<Props>> = function DisplayError({
  root,
  children,
  error,
  errorInfo,
  className,
  styles: stylesProp,
}) {
  const styles = useS(style);
  const stack = errorInfo?.componentStack || error?.stack;

  return styled(useStyles(stylesProp))(
    <div className={s(styles, { error: true, root }, className)}>
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
    </div>,
  );
};
