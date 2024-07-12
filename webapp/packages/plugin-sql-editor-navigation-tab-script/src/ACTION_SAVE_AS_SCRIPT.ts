/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_SAVE_AS_SCRIPT = createAction('save-as-script', {
  label: 'plugin_sql_editor_navigation_tab_resource_save_script_title',
  tooltip: 'plugin_sql_editor_navigation_tab_resource_save_script_title',
  icon: '/icons/save.svg',
});
