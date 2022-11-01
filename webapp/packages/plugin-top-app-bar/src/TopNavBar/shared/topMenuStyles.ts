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
  Loader {
    composes: secondary from global;
  }
  MenuButton, MenuBarElement {
    composes: theme-ripple from global;
    background: none;
    border: none;
    outline: none !important;
    color: inherit;
    cursor: pointer;
  }
  MenuButton, MenuTrigger, Button, MenuBarElement {
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
    & menu-bar-item-icon {
      width: 24px;
      height: 24px;
      display: flex;
      box-sizing: border-box;
      align-items: center;
      justify-content: center;
    }
    & menu-bar-item-box {
      display: flex;
      align-items: center;
      flex: 1;
      height: inherit;
      position: relative;
    }
    & menu-bar-item-icon IconOrImage {
      display: block;
      object-fit: contain;
    }
    & menu-trigger-icon, & menu-bar-item-icon {
      margin-right: 8px;
    }
    & menu-trigger-text, & menu-bar-item-label {
      max-width: 240px;
      overflow-x: hidden;
      text-overflow: ellipsis;
    }
    /*&:hover box > Icon,
    &:global([aria-expanded="true"]) box > Icon {
      background: #236ea0;
    }*/
  }
  MenuButton,
  MenuBarElement,
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
    MenuButton, MenuBarElement, MenuTrigger, Button {
      padding: 0 8px !important;
    }
  }
`;
