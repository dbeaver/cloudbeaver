/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type React from 'react';
import styled, { css, use } from 'reshadow';

import { ENotificationType } from '@cloudbeaver/core-events';

import { AppRefreshButton } from './AppRefreshButton';
import { NotificationMark } from './Snackbars/NotificationMark';

const style = css`
  container {
    width: 100%;
    height: 100%;
    display: flex;
    overflow: auto;

    &[|root] {
      height: 100vh;
    }
  }
  container-inner-block {
    display: flex;
    margin: auto;
    padding: 16px 24px;
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
}

export const DisplayError: React.FC<React.PropsWithChildren<Props>> = function DisplayError({
  root,
  children,
  error,
  errorInfo,
  className,
}) {
  const stack = errorInfo?.componentStack || error?.stack;

  return styled(style)(
    <container className={className} {...use({ root })}>
      <container-inner-block>
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
      </container-inner-block>
    </container>
  );
};
