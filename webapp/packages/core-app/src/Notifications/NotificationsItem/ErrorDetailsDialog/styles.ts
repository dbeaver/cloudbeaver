/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const styles = css`
  code, message {
    display: block;
    white-space: pre-wrap;
  }
  controls {
    display: flex;
    flex: 1;
    height: 100%;
    align-items: center;
    margin: auto;
    flex-direction: row-reverse;
  }
  Button {
    margin-left: 24px;
  }
  textarea {
    width: 100% !important;
    min-height: 270px;
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
