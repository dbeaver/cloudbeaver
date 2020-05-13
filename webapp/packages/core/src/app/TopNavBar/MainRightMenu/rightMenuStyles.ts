/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@dbeaver/core/theming';

export const rightMenuStyles = composes(
  css`
    Menu {
      composes: theme-text-on-primary from global;
    }
    Button {
      composes: theme-ripple from global;
    }
  `,
  css`
    Menu {
      background-color: #338ecc!important;
    }
    MenuTrigger, Button {
      height: 100%;
      padding: 0 16px !important;
      display: flex;
      align-items: center;
  
      & IconOrImage {
        display: block;
        width: 24px;
      }
      & menu-trigger-title {
        text-transform: uppercase;
        font-weight: 700;
        display: block;
        margin-left: 8px;
      }
    }
    Button {
      background: none;
      border: none;
      outline: none !important;
      color: inherit;
      cursor: pointer;
      display: flex;
      align-items: center;
    }
    MenuItem {
      &:hover {
        background: #236ea0;
      }
      &:before {
        display: none;
      }
    }
    menu-panel-item {
      flex-direction: row-reverse;
  
      & menu-item-text  {
        text-align: right;
      }
      & Icon {
        transform: rotate(-180deg);
      }
    }
  `
);
