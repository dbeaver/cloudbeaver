/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const ACTION_ICON_BUTTON_STYLES = css`
  IconButton {
    composes: theme-form-element-radius theme-ripple from global;

    padding: 4px !important;
    margin: 2px !important;
    width: 24px !important;
    height: 24px !important;
    overflow: hidden;
    flex-shrink: 0;
  }
`;