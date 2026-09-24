/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { StyleRegistry } from '@cloudbeaver/core-blocks';

import TabStyles from './Tab/Tab.module.css';
import TabTitleStyles from './Tab/TabTitle.module.css';
import TabListStyles from './TabList.module.css';
import VerticalTabsStyles from './VerticalTabs.module.css';

export const VerticalTabsStyleRegistry: StyleRegistry = [
  [TabListStyles, { mode: 'append', styles: [VerticalTabsStyles] }],
  [TabStyles, { mode: 'append', styles: [VerticalTabsStyles] }],
  [TabTitleStyles, { mode: 'append', styles: [VerticalTabsStyles] }],
];
