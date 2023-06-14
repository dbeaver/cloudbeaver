/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { css } from 'reshadow';

export const settingsMenuStyles = css`
  ContextMenu {
    padding: 0 16px !important;
    height: 32px;
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
    height: 16px;
  }
  menu-panel-item {
    & menu-item-text {
      text-align: right;
    }
    & Icon {
      transform: rotate(90deg);
    }
  }
  @media only screen and (max-width: 1200px) {
    ContextMenu {
      padding: 0 8px !important;
    }
  }
`;
