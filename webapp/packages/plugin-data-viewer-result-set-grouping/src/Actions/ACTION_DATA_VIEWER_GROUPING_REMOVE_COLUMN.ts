/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_VIEWER_GROUPING_REMOVE_COLUMN = createAction('data-viewer-grouping-remove-column', {
  label: 'ui_remove',
  tooltip: 'plugin_data_viewer_result_set_grouping_column_delete_tooltip',
  icon: '/icons/plugin_data_viewer_result_set_grouping_column_delete_sm.svg',
});
