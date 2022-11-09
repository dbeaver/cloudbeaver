/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const MENU_BAR_DEFAULT_STYLES = css`
    menu-bar {
      composes: theme-background-secondary theme-text-on-secondary theme-border-color-background theme-typography--body2 from global;
      height: 48px;
      display: flex;
    }
    
    menu-bar-item {
      composes: theme-ripple from global;
      padding: 0 16px;
      cursor: pointer;
      background: transparent;
      outline: none;
      color: inherit;

      & menu-bar-item-box {
        display: flex;
        align-items: center;
      }

      &[use|hidden] {
        display: none;
      }

      & menu-bar-item-icon {
        display: flex;
        width: 24px;
      }

      & Loader, & IconOrImage {
        width: 24px;
      }

      & menu-bar-item-label {
          display: block;
          text-transform: uppercase;
          font-weight: 700;
      }

      & menu-bar-item-icon + menu-bar-item-label {
          padding-left: 8px
      }
      
      & menu-bar-item-mark {
        display: none;
      }
    }

    MenuSeparator {
      composes: theme-border-color-background from global;
      height: 100%;
      margin: 0;
      border: 1px solid !important;

      &:first-child, &:last-child {
        display: none;
      }
    }
  `;
