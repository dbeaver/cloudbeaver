/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const UNDERLINE_TAB_STYLES = css`
    TabList {
      display: flex;
    }
    Tab {
      composes: theme-typography--body2 from global;
      background: none;
      color: inherit;
      border: none;
      border-bottom: 2px solid var(--theme-primary);
      outline: none;
      opacity: 1;
      height: 30px !important;
      padding: 0 14px !important;
      border-top: none !important;
      font-weight: normal !important;

      &:global([aria-selected="false"]) {
        opacity: 0.8;
        border-bottom: 2px solid transparent !important;
      }

      &:global([aria-disabled="true"]) {
        opacity: 0.5;
      }

      &:hover {
        cursor: pointer;
        opacity: 1;
      }
    }
`;
