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
import { NotificationMark } from './Snackbars/NotificationMark';
import { useStyles } from './useStyles';

const style = css`
  error {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: auto;

    &[|root] {
      height: 100vh;
    }
  }
  error-inner-block {
    display: flex;
    margin: auto;
    padding: 8px 16px;
    flex-direction: column;
    align-items: center;
  }
  NotificationMark {
    width: 40px;
    height: 40px;
  }
  details {
    padding: 8px 16px;
  }
`;

interface Props {
  root?: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  className?: string;
  styles?: ComponentStyle;
}

export const DisplayError: React.FC<React.PropsWithChildren<Props>> = function DisplayError({ root, children, error, errorInfo, className, styles }) {
  const stack = errorInfo?.componentStack || error?.stack;

  return styled(useStyles(style, styles))(
    <error className={className} {...use({ root })}>
      <error-inner-block>
        <NotificationMark type={ENotificationType.Error} />
        <p>Something went wrong.</p>
        {root && <AppRefreshButton />}
        {children}
        {error && (
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {error.toString()}
            {stack && <br />}
            {stack}
          </details>
        )}
      </error-inner-block>
    </error>,
  );
};
