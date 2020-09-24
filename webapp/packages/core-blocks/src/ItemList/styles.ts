/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import { css } from 'reshadow';

import { Style, composes } from '@cloudbeaver/core-theming';

export const ITEM_LIST_STYLES = composes(
  css`
    list-item {
      composes: theme-ripple theme-background-surface theme-border-color-secondary from global;
    }
    list-search {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    list-item-name {
      composes: theme-border-color-secondary from global;
    }
    ListSearchButton {
      composes: theme-ripple theme-background-primary theme-text-on-primary from global;
    }
  `,
  css`
    item-list {
      box-sizing: border-box;
      border-collapse: collapse;
      z-index: 0;
    }
    list-search {
      position: sticky;
      top: 0;
      padding: 8px 24px;
      z-index: 1;

      & input {
        padding: 4px 8px;
        padding-right: 32px;
      }

      & search-button {
        position: absolute;
        top: 8px;
        right: 24px;

        & ListSearchButton {
          position: relative;
          box-sizing: border-box;
          border-radius: 2px;
          height: 25px;
          width: 25px;
          margin: 2px;
        }
      }
    }
    list-item {
      border-bottom: 1px solid;
    }
    list-item {
      position: relative;
      cursor: pointer;
      display: flex;
      box-sizing: border-box;
      align-items: center;
      padding: 8px 12px;
    }
    list-item-icon {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      padding: 0 12px;

      & StaticImage {
        box-sizing: border-box;
        width: 24px;
      }
    }
    list-item-name {
      composes: theme-typography--body1 from global;
      box-sizing: border-box;
      font-weight: 500;
      min-width: 250px;
      padding: 0 24px 0 12px;
      border-right: 1px solid;
    
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    list-item-description {
      composes: theme-typography--body2 from global;
      box-sizing: border-box;
      max-width: 460px;
      padding: 0 12px 0 24px;
    
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `
);

export const ITEM_LIST_STYLES_ARRAY = [ITEM_LIST_STYLES];

export const Styles = createContext<Style[]>(ITEM_LIST_STYLES_ARRAY);
