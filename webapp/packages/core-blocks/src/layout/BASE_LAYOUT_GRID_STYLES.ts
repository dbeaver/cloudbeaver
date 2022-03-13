/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const BASE_LAYOUT_GRID_STYLES = css`
  layout-grid {
    composes: layout-grid from global;
  }
  layout-grid-inner {
    composes: layout-grid__inner from global;
  }
  layout-grid-cell {
    composes: layout-grid__cell from global;
  }
`;