/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const MENU_BAR_ITEM_STYLES = css`
  MenuBarElement {
    background: none;
    
    & menu-bar-item-label {
      font-weight: 500;
    }
      
    & menu-bar-item-mark {
      display: flex;
      padding-left: 6px;

      & Icon {
        width: 12px;
      }
    }
  }
`;

export const MENU_BAR_DISABLE_EFFECT_STYLES = css`
  Button:disabled,
  Button[aria-disabled="true"],
  MenuButton:disabled,
  MenuButton[aria-disabled="true"] {
    opacity: 1;
  }
`;

export const MENU_BAR_STYLES = css`
  menu-wrapper, MenuBar {
    display: flex;
    height: 100%;
  }
`;