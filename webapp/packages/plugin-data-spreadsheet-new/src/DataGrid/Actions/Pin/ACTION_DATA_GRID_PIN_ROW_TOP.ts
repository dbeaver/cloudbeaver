/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_GRID_PIN_ROW_TOP = createAction('data-grid-pin-row-top', {
  label: 'plugin_data_spreadsheet_new_pin_row_top',
  icon: 'pin-row-top',
});
