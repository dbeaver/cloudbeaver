/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_TAB_CLOSE_SQL_RESULT_GROUP = createAction('tab-close-sql-result-group', {
  label: 'plugin_sql_editor_action_close_group',
  tooltip: 'plugin_sql_editor_action_close_group',
});
