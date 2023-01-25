/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const TAB_PANEL_STYLES = css`
  wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
    composes: theme-typography--body1 from global;
  }

  SQLCodeEditorLoader {
    height: 100%;
    flex: 1;
    overflow: auto;
  }

  MenuBar {
    border-top: 1px solid;
  }
`;
