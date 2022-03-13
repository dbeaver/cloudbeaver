/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

interface Props {
  description?: React.ReactElement | string;
  before?: React.ReactElement;
  after?: React.ReactElement;
  style?: ComponentStyle;
  className?: string;
}

const styles = css`
    cell {
      composes: theme-ripple from global;
    } 
    main {
      position: relative;
      display: flex;
      align-items: center;
      padding: 8px;
    }
    before {
      margin-right: 16px;
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
    after {
      margin-left: 16px;
      flex-shrink: 0;
    }
    info {
      composes: theme-typography--body2 from global;
      flex: 1;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      font-weight: 500;
    }
    description {
      composes: theme-typography--caption from global;
      line-height: 1.2;
    }
`;

export const Cell: React.FC<Props> = function Cell({ before, after, description, style, className, children }) {
  return styled(useStyles(styles, style))(
    <cell className={className}>
      <main>
        <before>{before}</before>
        <info>
          {children}
          {description && <description>{description}</description>}
        </info>
        <after>{after}</after>
      </main>
    </cell>
  );
};
