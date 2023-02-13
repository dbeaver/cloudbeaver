/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const styles = css`
  container {
    height: 32px;
    display: flex;
  }
`;

interface Props {
  className?: string;
}

export const ToolsPanel: React.FC<React.PropsWithChildren<Props>> = function ToolsPanel({ className, children }) {
  return styled(styles)(
    <container className={className}>
      {children}
    </container>
  );
};
