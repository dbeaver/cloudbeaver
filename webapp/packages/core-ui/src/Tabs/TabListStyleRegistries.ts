/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { StyleRegistry } from '@cloudbeaver/core-blocks';

import TabStyles from './Tab/Tab.m.css';
import TabIconStyles from './Tab/TabIcon.m.css';
import TabIconVerticalRotatedStyles from './Tab/TabIconVerticalRotated.m.css';
import TabTitleStyles from './Tab/TabTitle.m.css';
import TabTitleVerticalRotatedStyles from './Tab/TabTitleVerticalRotated.m.css';
import TabVerticalStyles from './Tab/TabVertical.m.css';
import TabVerticalRotatedStyles from './Tab/TabVerticalRotated.m.css';
import TabListStyles from './TabList.m.css';
import TabListVerticalStyles from './TabListVertical.m.css';
import TabListVerticalRotatedStyles from './TabListVerticalRotated.m.css';

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
