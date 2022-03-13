/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const PROPERTIES_TABLE_STYLES = css`
    properties {
      display: flex;
      flex: 1 0 auto;
      flex-direction: column;
    }
    properties-header {
      composes: theme-background-surface theme-text-on-surface theme-border-color-secondary from global;
      box-sizing: border-box;
      display: inline-flex;
      border-bottom: solid 1px;
    }
    properties-header-name, properties-header-value {
      composes: theme-typography--caption from global;
      text-transform: uppercase;
      box-sizing: border-box;
      flex: 1;
      padding: 4px 36px;
    }
    properties-header-name {
      flex: 0 0 auto;
      width: 300px;
    }
    properties-header-add {
      flex: 0 0 auto;
      padding: 0px 28px;
    }

    properties-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
      max-height: 600px;
      padding: 4px 0px;
    }

    properties-list-overflow {
      composes: branding-overflow from global;
      position: sticky;
      flex-shrink: 0;
      bottom: -4px;
      width: 100%;
      height: 24px;
      pointer-events: none;
    }
  `;

export const PROPERTIES_TABLE_ADD_STYLES = css`
  button-icon {
    margin-right: 0px !important;
  }
  button-label {
    composes: theme-typography--caption from global;
    text-transform: initial;
    font-weight: 600;
  }
`;
