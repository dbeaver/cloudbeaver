/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const settingsMenuStyles = css`
  MenuTrigger {
    padding: 0 16px !important;
    height: 48px;
    cursor: pointer;
    background: none;
    border: none;
    text-transform: uppercase;
    font-weight: 700;
    outline: none !important;
  }
  box {
    width: 100%;
  }
  Icon {
    height: 24px;
  }
  menu-panel-item {
    flex-direction: row-reverse;
    & menu-item-text  {
      text-align: right;
      margin-left: auto;
    }
    & Icon {
      transform: rotate(-180deg);
    }
  }
`;
