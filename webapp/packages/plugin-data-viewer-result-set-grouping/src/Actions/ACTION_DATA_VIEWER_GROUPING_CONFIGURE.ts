/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_DATA_VIEWER_GROUPING_CONFIGURE = createAction('data-viewer-grouping-configure', {
  label: 'plugin_data_viewer_result_set_grouping_action_configure',
  tooltip: 'plugin_data_viewer_result_set_grouping_action_configure_tooltip',
  icon: '/icons/settings.svg',
});
