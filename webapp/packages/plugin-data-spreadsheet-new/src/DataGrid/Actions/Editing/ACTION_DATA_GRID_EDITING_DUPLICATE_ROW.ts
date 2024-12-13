/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_EDITING_DUPLICATE_ROW = createAction('data-grid-editing-duplicate-row', {
  label: 'data_grid_table_editing_row_add_copy',
  icon: '/icons/data_add_copy_sm.svg',
});
