/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { css } from 'reshadow';

export const EXPANDABLE_FORM_STYLES = css`
  expand-label {
    composes: theme-typography--body2 from global;
    font-weight: 400;
    margin: 0;
    text-transform: uppercase;
    opacity: 0.9;
  }
`;