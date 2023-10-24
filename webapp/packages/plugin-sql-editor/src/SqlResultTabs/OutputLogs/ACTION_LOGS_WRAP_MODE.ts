/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_LOGS_WRAP_MODE = createAction('logs-wrap-mode', {
  label: 'sql_editor_output_logs_wrap_mode',
  tooltip: 'sql_editor_output_logs_wrap_mode',
});
