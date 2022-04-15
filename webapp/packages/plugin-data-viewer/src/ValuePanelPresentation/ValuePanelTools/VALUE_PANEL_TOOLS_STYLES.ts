/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const VALUE_PANEL_TOOLS_STYLES = css`
  tools-container {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
  tools {
    composes: theme-background-surface theme-text-on-surface theme-border-color-background theme-form-element-radius from global;
    display: flex;
    box-sizing: border-box;
    border: 2px solid;
  }
  tools-action {
    composes: theme-ripple from global;
    box-sizing: border-box;
    background: inherit;
    cursor: pointer;
    padding: 4px;
    width: 24px;
    height: 100%;
  }
  IconOrImage {
    width: 100%;
    height: 100%;
  }
`;