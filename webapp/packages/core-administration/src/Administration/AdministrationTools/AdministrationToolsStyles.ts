
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

import { composes } from '@cloudbeaver/core-theming';

export const ADMINISTRATION_TOOLS_STYLES = composes(
  css`
    AdministrationTools {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
  `,
  css`
    AdministrationTools {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      border-bottom: solid 1px;
      height: 48px;
      & LabeledIconButton {
        font-weight: 600;
        font-size: 15px;
      }
    }
  `
);
