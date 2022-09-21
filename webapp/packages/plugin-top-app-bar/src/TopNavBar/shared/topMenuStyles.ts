/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const topMenuStyles = css`
  checkbox {
    composes: theme-checkbox_surface from global;
  }
  Button {
    composes: theme-ripple from global;
  }
  menu-box {
    composes: theme-text-on-primary from global;
    background-color: #338ecc!important;
  }
  menu-box menu-panel-item {
    border-color: #ffffff !important;
  }
  MenuTrigger, Button {
    height: 100%;
    padding: 0 16px !important;

    & box > div {
      display: block;
    }
    & box > Icon {
      width: 14px;
      height: 100%;
      padding: 0 4px;
    }
    & IconOrImage {
      display: block;
      width: 24px;
    }
    & menu-trigger-icon {
      margin-right: 8px;
    }
    & menu-trigger-text {
      max-width: 240px;
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
    /*&:hover box > Icon,
    &:global([aria-expanded="true"]) box > Icon {
      background: #236ea0;
    }*/
  }
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio {
    &:hover, &:global([aria-expanded="true"]) {
      background: #236ea0;
    }
    &:before {
      display: none;
    }
  }
  @media only screen and (max-width: 1200px) {
    MenuTrigger, Button {
      padding: 0 8px !important;
    }
  }
`;
