/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

export const topAppBarStyles = composes(
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
  `
);

export function TopAppBar({ children }: React.PropsWithChildren<{}>) {
  return styled(useStyles(topAppBarStyles))(
    <header>
      {children}
    </header>
  );
}
