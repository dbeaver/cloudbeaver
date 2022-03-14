
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const ADMINISTRATION_TOOLS_PANEL_STYLES = css`
    ToolsPanel {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
      border-bottom: solid 1px;
      flex: 0 0 auto;
    }
  `;
