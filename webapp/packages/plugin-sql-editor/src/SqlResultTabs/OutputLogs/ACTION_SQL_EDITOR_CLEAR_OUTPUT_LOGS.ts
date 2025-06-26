/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_SQL_EDITOR_CLEAR_OUTPUT_LOGS = createAction('action_sql_editor_clear_output_logs', {
  label: 'ui_clear',
  icon: 'erase',
  tooltip: 'ui_clear',
});
