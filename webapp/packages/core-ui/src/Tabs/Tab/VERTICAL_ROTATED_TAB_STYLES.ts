/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const VERTICAL_ROTATED_TAB_STYLES = css`
  tab-outer {
    display: table;
  }
  tab-inner {
    padding: 50% 0;
    height: 0;

    & Tab {
      transform-origin: top left;
      display: block;
      box-sizing: border-box;
      transform: rotate(-90deg) translate(-100%);
      margin-top: -50%;
      height: 32px;
      border: none;
    }
  }
  TabList {
    outline: none;
    max-width: 32px;
    flex-direction: column;
  }
`;
