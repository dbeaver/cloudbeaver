/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { useStyles, composes } from '@cloudbeaver/core-theming';

const LINK_STYLES = composes(
  css`
    link {
      composes: theme-text-primary from global;
    }
  `,
  css`
    link {
      composes: theme-typography--body2 from global;
      & a {
        color: inherit;
        text-decoration: none;
      }
      & a:hover {
        text-decoration: underline;
      }
    }
  `
);

export function Link({
  className,
  children,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return styled(useStyles(LINK_STYLES))(
    <link className={className} as='div'>
      <a {...rest}>{children}</a>
    </link>
  );
}
