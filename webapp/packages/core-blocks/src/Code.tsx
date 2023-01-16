/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

interface Props {
  className?: string;
}

const styles = css`
    code-container {
      composes: theme-background-secondary theme-text-on-secondary from global;
      padding: 16px;
    }
`;

export const Code: React.FC<React.PropsWithChildren<Props>> = function Code({ children, className }) {
  return styled(styles)(
    <code-container className={className}>
      <code>
        {children}
      </code>
    </code-container>
  );
};
