/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_SHOW_OUTPUT_LOGS = createAction('action-show_output_logs', {
  label: 'sql_editor_output_logs_button_tooltip',
  icon: '/icons/sql_output_logs.svg',
  tooltip: 'sql_editor_output_logs_button_tooltip',
});
