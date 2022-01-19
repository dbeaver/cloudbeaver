/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const DATA_VIEWER_CONSTRAINTS_DELETE_ACTION = createAction('data-viewer-constraints-delete', {
  label: 'data_grid_table_delete_filters_and_orders',
  tooltip: 'data_grid_table_delete_filters_and_orders',
  icon: 'erase',
});
