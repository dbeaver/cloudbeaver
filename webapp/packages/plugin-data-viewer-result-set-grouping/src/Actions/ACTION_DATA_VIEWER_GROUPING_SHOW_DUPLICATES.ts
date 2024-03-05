/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_VIEWER_GROUPING_SHOW_DUPLICATES = createAction('data-viewer-grouping-show-duplicates', {
  label: 'plugin_data_viewer_result_set_grouping_action_show_duplicates',
  tooltip: 'plugin_data_viewer_result_set_grouping_action_show_duplicates',
  icon: '/icons/plugin_data_viewer_result_set_grouping_show_duplicates_sm.svg',
});