/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import styled, { css } from 'reshadow';

export const topAppBarStyles = css`
  header {
    composes: theme-text-on-primary theme-typography--body2 from global;
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 8px;
    background-color: #2a7cb4;
    z-index: 1;
    flex-shrink: 0;
  }
`;

interface Props extends React.PropsWithChildren {
  className?: string;
}

export const TopAppBar: React.FC<Props> = function TopAppBar({ children, className }) {
  return styled(topAppBarStyles)(<header className={className}>{children}</header>);
};
