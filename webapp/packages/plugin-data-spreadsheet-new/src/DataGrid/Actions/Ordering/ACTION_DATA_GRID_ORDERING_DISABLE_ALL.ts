/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_ORDERING_DISABLE_ALL = createAction('data-grid-ordering-disable-all', {
  label: 'data_grid_table_disable_all_orders',
});
