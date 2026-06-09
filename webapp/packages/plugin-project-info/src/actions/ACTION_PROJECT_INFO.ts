/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_PROJECT_INFO = createAction('project-info', {
  label: 'plugin_project_info_tree_menu_item_title',
  tooltip: 'plugin_project_info_tree_menu_item_title',
});
