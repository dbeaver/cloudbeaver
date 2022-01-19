/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const folderExplorerStyles = css`
  folder-explorer-path {
    display: flex;
    composes: theme-typography--caption from global;
  }

  folder-explorer-path-element {
    display: flex;
    align-items: center;
  }

  folder-explorer-path-element-arrow {
    width: 16px;
    height: 16px;
    transform: rotate(-90deg);
    margin: 0 4px;
    opacity: 0.5;
  }

  folder-explorer-path-element-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  folder-explorer-path-element:first-child folder-explorer-path-element-arrow {
    display: none
  }
`;
