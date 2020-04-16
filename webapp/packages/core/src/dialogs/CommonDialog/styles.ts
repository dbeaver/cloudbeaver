/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const dialogStyles = css`
    DialogBackdrop {
      box-sizing: border-box;
      background-color: #0000007a;
      position: fixed;
      top: 0px;
      right: 0px;
      bottom: 0px;
      left: 0px;
    }

    Dialog {
      box-sizing: border-box;
      display: flex;
      position: fixed;
      align-items: center;
      justify-content: center;
      top: 0;
      padding: 54px;
      width: 100%;
      height: 100%;
      z-index: 999;
    }
  `;
