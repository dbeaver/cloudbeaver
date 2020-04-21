/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@dbeaver/core/theming';

export const topNavBarStyles = composes(
  css`
    header {
      composes: theme-background-primary theme-text-on-primary from global;
    }
  `,
  css`
    header {
      composes: theme-typography--body2 from global;
      display: flex;
      align-items: center;
      height: 48px;
      padding: 0 16px;
      z-index: 1;
    }
    logo {
      height: 100%;
      display: flex;
      align-items: center;
      margin-right: 16px;
      width: 250px;

      & Icon {
        height: 24px;
        width: auto;
        margin-bottom: 2px;
      }
    }
  `
);
