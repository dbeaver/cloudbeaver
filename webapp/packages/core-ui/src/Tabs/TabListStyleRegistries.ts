/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { StyleRegistry } from '@cloudbeaver/core-blocks';

import TabStyles from './Tab/Tab.module.css';
import TabIconStyles from './Tab/TabIcon.module.css';
import TabIconVerticalRotatedStyles from './Tab/TabIconVerticalRotated.module.css';
import TabTitleStyles from './Tab/TabTitle.module.css';
import TabTitleVerticalRotatedStyles from './Tab/TabTitleVerticalRotated.module.css';
import TabVerticalStyles from './Tab/TabVertical.module.css';
import TabVerticalRotatedStyles from './Tab/TabVerticalRotated.module.css';
import TabListStyles from './TabList.module.css';
import TabListVerticalStyles from './TabListVertical.module.css';
import TabListVerticalRotatedStyles from './TabListVerticalRotated.module.css';

export const TabListVerticalRegistry: StyleRegistry = [
  [
    TabListStyles,
    {
      mode: 'append',
      styles: [TabListVerticalStyles],
    },
  ],
  [
    TabStyles,
    {
      mode: 'append',
      styles: [TabVerticalStyles],
    },
  ],
];

export const TabListVerticalRotatedRegistry: StyleRegistry = [
  [
    TabListStyles,
    {
      mode: 'append',
      styles: [TabListVerticalRotatedStyles],
    },
  ],
  [
    TabStyles,
    {
      mode: 'append',
      styles: [TabVerticalRotatedStyles],
    },
  ],
  [
    TabIconStyles,
    {
      mode: 'append',
      styles: [TabIconVerticalRotatedStyles],
    },
  ],
  [
    TabTitleStyles,
    {
      mode: 'append',
      styles: [TabTitleVerticalRotatedStyles],
    },
  ],
];
