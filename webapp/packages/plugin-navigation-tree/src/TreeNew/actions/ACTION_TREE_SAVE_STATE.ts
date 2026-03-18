/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_TREE_SAVE_STATE = createAction('tree-save-state', {
  label: 'plugin_navigation_tree_settings_save_state',
  type: 'checkbox',
}); 
