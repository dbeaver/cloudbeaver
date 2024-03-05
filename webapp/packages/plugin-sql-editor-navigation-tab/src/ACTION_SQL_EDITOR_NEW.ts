/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_SQL_EDITOR_NEW = createAction('sql-editor-new', {
  label: 'plugin_sql_editor_navigation_tab_action_sql_editor_new',
  icon: '/icons/plugin_sql_editor_navigation_tab_new_m.svg',
  tooltip: 'plugin_sql_editor_navigation_tab_action_sql_editor_new_tooltip',
});
