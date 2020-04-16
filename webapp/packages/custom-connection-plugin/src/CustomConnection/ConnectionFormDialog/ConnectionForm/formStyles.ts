/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const formStyles = css`
  connection-type {
    padding: 12px;
  }
  Radio {
    composes: theme-typography--body1 from global;
    font-weight: 500;
    padding: 0 12px;
  }
  sub-label {
    composes: theme-typography--caption from global;
    line-height: 14px;
  }
  group {
    box-sizing: border-box;
    display: flex;
    margin: 0 12px;
  }
  InputField[|short] {
    min-width: unset;
    max-width: 250px;
  }
  hr {
    margin-left: 24px;
    margin-right: 24px;
  }
`;
