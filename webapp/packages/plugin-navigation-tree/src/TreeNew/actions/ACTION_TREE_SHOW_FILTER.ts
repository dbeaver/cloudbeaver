/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_TREE_SHOW_FILTER = createAction('tree-show-filter', {
  label: 'plugin_navigation_tree_settings_show_filter',
  type: 'checkbox',
}); 
