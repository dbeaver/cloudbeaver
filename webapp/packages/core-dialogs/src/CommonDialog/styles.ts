/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const dialogStyles = css`
    DialogBackdrop {
      box-sizing: border-box;
      background-color: rgba(0,0,0,0.48);
      /*backdrop-filter: blur(4px);
      background-color: rgba(221, 221, 221, 0.25);*/
      position: fixed;
      top: 0px;
      right: 0px;
      bottom: 0px;
      left: 0px;
      z-index: 999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    Dialog {
      box-sizing: border-box;
      display: flex;
      max-height: calc(100vh);
      z-index: 999;
      outline: none;
    }
  `;
