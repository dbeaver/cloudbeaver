/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const formStyles = css`
  connection-form {
    flex: 1;
    display: flex;
    flex-direction: row;
    padding: 18px 36px;
  }
  left-box {
    display: flex;
    flex-direction: column;
  }
  right-box {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  connection-type {
    margin-left: 150px;
  }
  Radio {
    composes: theme-typography--body1 from global;
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
`;
