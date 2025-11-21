/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_FILTER_DELETE_FOR_COLUMN = createAction('data-grid-filter-delete-for-column', {
  label: 'data_grid_table_filter_delete_for_column',
  icon: 'filter-reset',
});
