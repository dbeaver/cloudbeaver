/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const treeNodeMenuStyles = css`
  MenuTrigger {
    margin-left: 16px;
    padding: 0;
    height: 20px;

    & Icon {
      cursor: pointer;
      width: 16px;
      height: 10px;
      fill: #dedede;
    }

    &[use|isSelected] Icon, 
    &:hover Icon, 
    &:focus Icon {
      fill: #338fcc;
    }
  }
`;
