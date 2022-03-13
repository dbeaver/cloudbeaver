/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

export const topAppBarStyles = css`
    header {
      composes: theme-background-primary theme-text-on-primary theme-typography--body2 from global;
      display: flex;
      align-items: center;
      height: 48px;
      padding: 0 16px;
      z-index: 1;
    }
  `;

export const TopAppBar: React.FC = function TopAppBar({ children }) {
  return styled(useStyles(topAppBarStyles))(
    <header>
      {children}
    </header>
  );
};
