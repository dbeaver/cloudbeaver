/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const DATA_VIEWER_REFRESH_ACTION = createAction('data-viewer-refresh', {
  label: 'ui_refresh',
  tooltip: 'data_viewer_refresh_result_set',
  icon: 'reload',
});
