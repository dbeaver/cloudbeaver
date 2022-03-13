/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const BASE_DROPDOWN_STYLES = css`
    MenuItem {
      composes: theme-ripple from global;
    }

    Menu {
      composes: theme-text-on-surface theme-background-surface theme-typography--caption theme-elevation-z3 from global;
      display: flex;
      flex-direction: column;
      max-height: 300px;
      overflow: auto;
      outline: none;
      z-index: 999;
      border-radius: var(--theme-form-element-radius);

      & MenuItem {
        background: transparent;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 8px 12px;
        text-align: left;
        outline: none;
        color: inherit;
        cursor: pointer;
        gap: 8px;

        & item-icon, & item-title {
          position: relative;
        }

        & item-icon {
          width: 16px;
          height: 16px;
          overflow: hidden;
          flex-shrink: 0;

          & IconOrImage {
            width: 100%;
            height: 100%;
          }
        } 
      }
    }
  `;