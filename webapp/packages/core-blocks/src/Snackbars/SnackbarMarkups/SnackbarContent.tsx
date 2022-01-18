/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import styled, { css } from 'reshadow';

const SNACKBAR_CONTENT_STYLES = css`
  notification-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }
`;

interface ISnackbarContent {
  className?: string;
}

export const SnackbarContent: React.FC<ISnackbarContent> = function SnackbarContent({ children, className }) {
  return styled(SNACKBAR_CONTENT_STYLES)(
    <notification-content as='div' className={className}>
      {children}
    </notification-content>
  );
};
