/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const treeNodeMenuStyles = css`
  ContextMenu {
    margin-left: 16px;
    padding: 0;
    height: 16px;

    &:before {
      display: none;
    }

    & Icon {
      cursor: pointer;
      width: 16px;
      height: 10px;
      fill: #dedede;
    }

    &[|selected] Icon, 
    &:hover Icon, 
    &:focus Icon {
      fill: #338fcc;
    }
  }
`;
