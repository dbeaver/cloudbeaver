/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_COUNT_TOTAL_ELEMENTS = createAction('data-count-total-elements', {
  label: 'ui_count_total_elements',
  tooltip: 'data_viewer_total_count_tooltip',
  icon: '/icons/data_row_count.svg',
});
