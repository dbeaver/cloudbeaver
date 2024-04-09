/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { StyleRegistry } from '@cloudbeaver/core-blocks';

import TabStyles from './Tab.m.css';
import TabBigUnderlineStyles from './TabBigUnderlineStyles.m.css';
import TabTitleStyles from './TabTitle.m.css';
import TabTitleBigUnderlineStyles from './TabTitleBigUnderlineStyles.m.css';
import TabUnderlineStyles from './TabUnderline.m.css';

export const TabUnderlineStyleRegistry: StyleRegistry = [[TabStyles, { mode: 'append', styles: [TabUnderlineStyles] }]];
export const TabBigUnderlineStyleRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [TabUnderlineStyles, TabBigUnderlineStyles] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleBigUnderlineStyles] }],
];
