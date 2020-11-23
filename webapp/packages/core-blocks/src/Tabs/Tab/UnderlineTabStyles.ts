/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const UNDERLINE_TAB_STYLES = css`
  TabList {
    display: flex;
    & tab-outer:not(:last-child) {
      margin-right: 15px;
    }
  }
  Tab {
    composes: theme-typography--body2 from global;
    position: relative;
    background: none;
    color: inherit;
    border: none;
    outline: none;
    opacity: 0.8;
    &:hover {
      cursor: pointer;
      opacity: 1;
    }
    &:global([aria-selected="true"]) {
      opacity: 1;
      &:after {
        content: '';
        display: block;
        position: absolute;
        left: 0;
        bottom: -5px;
        width: 100%;
        height: 2px;
        border-radius: 2px;
        background: #3f8ae0;
      }
    }
  }
`;
