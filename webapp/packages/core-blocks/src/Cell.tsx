/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

interface Props {
  description?: string;
  before?: JSX.Element;
  className?: string;
}

const styles = composes(
  css`
    cell {
      composes: theme-ripple from global;
    }  
`,
  css`
    main {
      display: flex;
      align-items: center;
      padding: 12px;
    }
    before {
      margin-right: 12px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    info {
      composes: theme-typography--body2 from global;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      font-weight: 500;
    }
    description {
      composes: theme-typography--caption from global;
      line-height: 1.2;
    }
`);

export const Cell: React.FC<Props> = function Cell({ before, description, className, children }) {
  return styled(useStyles(styles))(
    <cell className={className}>
      <main>
        <before>{before && before}</before>
        <info>
          {children}
          {description && <description>{description}</description>}
        </info>
      </main>
    </cell>
  );
};
