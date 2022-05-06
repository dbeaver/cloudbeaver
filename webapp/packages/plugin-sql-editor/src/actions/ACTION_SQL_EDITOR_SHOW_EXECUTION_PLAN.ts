/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_SQL_EDITOR_SHOW_EXECUTION_PLAN = createAction(
  'sql-editor-show-execution-plan',
  {
    icon: '/icons/sql_execution_plan.svg',
    label: 'sql_editor_execution_plan_button_tooltip',
  }
);
