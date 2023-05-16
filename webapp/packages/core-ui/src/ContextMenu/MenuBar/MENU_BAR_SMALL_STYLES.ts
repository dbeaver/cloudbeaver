/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const MENU_BAR_SMALL_STYLES = css`
    menu-bar-item {
      padding: 0 12px;

      & menu-bar-item-icon {
        display: flex;
        width: 16px;
      }

      & menu-bar-item-label {
        font-size: 12px;
      }

      & Loader, & IconOrImage {
        width: 16px;
      }
    }
    menu-bar {
      height: 32px;
    }
  `;
