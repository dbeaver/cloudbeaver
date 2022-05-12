/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const SQL_EDITOR_ACTIONS_MENU_STYLES = css`
  menu-bar {
    width: 32px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  menu-bar-item {
    composes: theme-ripple from global;
    background: none;
    padding: 0;
    margin: 0;
    height: 32px;
    width: 32px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;

    &[use|hidden] {
      display: none;
    }

    & IconOrImage, & StaticImage {
      height: 16px;
      width: 16px;
      cursor: pointer;
    }

    & Loader {
      width: 24px;
    }

    & item-label {
        display: block;
        text-transform: uppercase;
        font-weight: 700;
    }

    & IconOrImage + item-label, & Loader + item-label {
        padding-left: 8px
    }
  }

  MenuSeparator {
    composes: theme-border-color-background from global;
    height: 100%;
    margin: 0;
    border: 1px solid !important;
  }
`;