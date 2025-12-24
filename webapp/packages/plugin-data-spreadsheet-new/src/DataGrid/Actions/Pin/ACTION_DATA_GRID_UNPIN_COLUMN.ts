/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_UNPIN_COLUMN = createAction('data-grid-unpin-column', {
  label: 'plugin_data_spreadsheet_new_unpin_column',
  icon: 'unpin-column',
});
