/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const dialogStyle = css`
  footer {
    align-items: center;
    justify-content: flex-end;
    gap: 24px;
  }
`;

export const styles = css`
  code, message {
    display: block;
    white-space: pre-wrap;
  }
  textarea {
    min-height: 270px !important;
  }
  message {
    overflow: auto;
    max-height: 96px;
  }
  property {
    padding: 8px 16px;
  }
  error-details {
    border: solid 1px;
  }
`;
