/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const REFRESH_RESULT_SET_ACTION = createAction('refresh-result-set', {
  label: 'ui_refresh',
  tooltip: 'data_viewer_refresh_result_set',
  icon: 'reload',
});
