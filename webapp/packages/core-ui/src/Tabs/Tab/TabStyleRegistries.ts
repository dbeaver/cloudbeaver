/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { StyleRegistry } from '@cloudbeaver/core-blocks';

import TabStyles from './Tab.module.css';
import TabBigUnderlineStyles from './TabBigUnderlineStyles.module.css';
import TabTitleStyles from './TabTitle.module.css';
import TabTitleBigUnderlineStyles from './TabTitleBigUnderlineStyles.module.css';
import TabUnderlineStyles from './TabUnderline.module.css';

export const TabUnderlineStyleRegistry: StyleRegistry = [[TabStyles, { mode: 'append', styles: [TabUnderlineStyles] }]];
export const TabBigUnderlineStyleRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [TabBigUnderlineStyles] }],
  [TabTitleStyles, { mode: 'append', styles: [TabTitleBigUnderlineStyles] }],
];
