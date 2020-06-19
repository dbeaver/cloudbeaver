/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const PROPERTIES_TABLE_STYLES = composes(
  css`
    properties-header {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    properties-header-name, properties-header-value {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    properties {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
    properties-header {
      box-sizing: border-box;
      display: inline-flex;
      padding: 2px;
      position: sticky;
      z-index: 1;
      top: 0;
    }
    properties-header-name, properties-header-value {
      composes: theme-typography--caption from global;
      text-transform: uppercase;
      box-sizing: border-box;
      flex: 1;
      padding: 4px 36px;
      margin: 0px 1px;
    }
    properties-header-name {
      flex: 0 0 auto;
      width: 300px;
    }
    properties-header-right {
      flex: 0 0 auto;
      margin: 0px 1px;
    }

    properties-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding-bottom: 24px;
    }
  `
);
