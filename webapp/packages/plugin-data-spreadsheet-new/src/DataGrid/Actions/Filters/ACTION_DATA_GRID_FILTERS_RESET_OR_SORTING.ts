/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_FILTERS_RESET_OR_SORTING = createAction('data-grid-filters-or-sorting-reset', {
  label: 'data_grid_table_delete_filters_and_orders',
  icon: 'erase',
});
