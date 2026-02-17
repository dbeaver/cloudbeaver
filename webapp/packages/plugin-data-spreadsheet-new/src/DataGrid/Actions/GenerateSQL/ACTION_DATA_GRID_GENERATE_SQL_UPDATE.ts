/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_GENERATE_SQL_UPDATE = createAction('data-grid-generate-sql-update', {
  label: 'data_grid_table_generate_sql_update',
  tooltip: 'data_grid_table_generate_sql_update_tooltip',
});
