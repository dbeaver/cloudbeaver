/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const SNACKBAR_FOOTER_STYLES = css`
  notification-footer {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  footer-time {
    composes: theme-typography--caption from global;
    opacity: 0.7;
  }
  actions:empty {
    display: none;
  }
  actions > *:not(:first-child) {
    margin-left: 16px;
  }
`;

interface ISnackbarFooter {
  timestamp: number;
  className?: string;
}

export const SnackbarFooter: React.FC<ISnackbarFooter> = function SnackbarFooter({ timestamp, className, children }) {
  const timeStringFromTimestamp = new Date(timestamp).toLocaleTimeString();

  return styled(SNACKBAR_FOOTER_STYLES)(
    <notification-footer as='div' className={className}>
      <footer-time as='span'>{timeStringFromTimestamp}</footer-time>
      <actions as="div">
        {children}
      </actions>
    </notification-footer>
  );
};
