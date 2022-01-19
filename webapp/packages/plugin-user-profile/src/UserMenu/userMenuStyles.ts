/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const userMenuStyles = css`
  ContextMenu {
    opacity: 1;
    padding: 0 !important;
    height: 48px;
    cursor: pointer;
    background: none;
    border: none;
    outline: none !important;
    & Icon {
        background: #47a0dd;
        width: 16px;
        height: 100%;
        padding: 0 16px;
    }
  }
`;
