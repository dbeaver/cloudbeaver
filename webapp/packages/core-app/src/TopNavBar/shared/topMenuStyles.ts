/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const topMenuStyles = composes(
  css`
    menu-box {
      composes: theme-text-on-primary from global;
    }
    
    checkbox {
      composes: theme-checkbox_surface from global;
    }
  `,
  css`
    menu-box {
      background-color: #338ecc!important;
    }
    MenuTrigger {
      height: 100%;
      padding: 0 16px !important;
      padding-right: 0!important;

      &:before {
        display: none;
      }
  
      & box > div {
        display: block;
      }
      & box > Icon {
        background: #47a0dd;
        margin-left: 16px;
        width: 16px;
        height: 100%;
        padding: 0 16px;
      }
      & IconOrImage {
        display: block;
        width: 24px;
      }
      & menu-trigger-icon {
        margin-right: 8px;
      }
      &:hover box > Icon,
      &:global([aria-expanded="true"]) box > Icon {
        background: #236ea0;
      }
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
  `
);
