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
    clip-path: inset(0px -16px -16px -16px); /* clip shadow from top edge of menu */
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
  MenuTrigger, Button, MenuBarElement {
    height: 100%;
    padding: 0 8px !important;
    margin-right: 1px;

    &:after {
      position: absolute;
      background: #236ea0 !important;
      height: 32px;
      width: 1px;
      top: 8px;
      right: -1px;
      opacity: 1 !important;
      content: "";
    }

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

      &:empty {
        display: none;
      }
    }
    & menu-bar-item-box {
      display: flex;
      align-items: center;
      flex: 1;
      height: inherit;
      position: relative;
      min-width: 32px;
      justify-content: center;
    }
    & menu-bar-item-icon IconOrImage {
      display: block;
      object-fit: contain;
    }
    & menu-bar-item-mark {
      padding-left: 0 !important;
    }
    & menu-trigger-text, & menu-bar-item-label {
      white-space: nowrap;
      max-width: 240px;
      overflow-x: hidden;
      text-overflow: ellipsis;
      padding: 0 8px;

      &:first-child {
        padding-left: 0px;
      }

      &:last-child {
        padding-right: 0px;
      }
    }
    & padding:not(:last-child) {
      padding-right: 8px;
    }
    /*&:hover box > Icon,
    &:global([aria-expanded="true"]) box > Icon {
      background: #236EA0;
    }*/
  }
  MenuPanel menu-box MenuSeparator {
    border-color: #236ea0 !important;
  }
  MenuButton,
  MenuBarElement,
  MenuItem,
  MenuItemCheckbox,
  MenuItemRadio {
    &:hover, &:global([aria-expanded="true"]) {
      background: #236EA0;
    }
    &:before {
      display: none;
    }
  }
  MenuButton, MenuBarElement {
    &:hover, &:global([aria-expanded="true"]) {
      background: #338ecc;
    }
  }
  @media only screen and (max-width: 1200px) {
    MenuButton, MenuBarElement, MenuTrigger, Button {
      padding: 0 8px !important;
    }
  }
`;
