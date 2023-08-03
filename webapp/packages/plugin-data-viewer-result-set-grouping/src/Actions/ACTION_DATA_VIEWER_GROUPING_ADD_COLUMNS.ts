/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_VIEWER_GROUPING_ADD_COLUMNS = createAction('data-viewer-grouping-edit', {
  label: 'plugin-data-viewer-result-set-grouping_action_add_columns',
  tooltip: 'plugin-data-viewer-result-set-grouping_action_add_columns',
  icon: '/icons/plugin_data_viewer_result_set_grouping_add_column.svg',
});
