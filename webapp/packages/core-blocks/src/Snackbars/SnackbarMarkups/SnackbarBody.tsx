/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const SNACKBAR_BODY_STYLES = css`
  notification-body {
    display: flex;
    flex-direction: column;
    flex: 1;
    & body-text-block {
      margin-top: 8px;
      padding-right: 24px;
      & message {
        font-size: 16px;
        opacity: 0.8;
        overflow: auto;
        max-height: 200px;
        margin-bottom: 8px;
        word-break: break-word;
        white-space: pre-line;
      }
    }
  }

  text-block-title {
    composes: theme-typography--headline6 from global;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    line-height: 1.55rem;
    font-weight: 700;
    margin: 0;
    padding: 0;
    margin-bottom: 8px;
  }
`;

interface ISnackbarBodyProps {
  title: string;
  className?: string;
}

export const SnackbarBody: React.FC<ISnackbarBodyProps> = function SnackbarBody({
  title, className, children,
}) {
  return styled(SNACKBAR_BODY_STYLES)(
    <notification-body as="div" className={className}>
      <body-text-block as='div'>
        <text-block-title title={title} as='h2'>{title}</text-block-title>
        <message as="div">
          {children}
        </message>
      </body-text-block>
    </notification-body>
  );
};
