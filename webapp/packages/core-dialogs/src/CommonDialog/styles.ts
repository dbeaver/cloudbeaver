/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
      overflow: auto;
    }

    inner-box {
      display: flex;
      margin: auto;
      padding: 24px;
      flex-direction: column;
      align-items: center;
    }

    Dialog {
      box-sizing: border-box;
      display: flex;
      outline: none;
    }
  `;
