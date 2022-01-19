/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const verticalTabStyles = css`
  Tab {
    overflow: auto;
    border: none !important;
    flex-shrink: 0;
    height: 36px !important;
  }
  vertical-tabs {
    display: flex;
    overflow: hidden;
  }
  TabList {
    display: flex;
    flex-direction: column;
    flex: 0 0 auto;
    min-width: 150px;
    overflow: auto;
    outline: none;
  }
`;
