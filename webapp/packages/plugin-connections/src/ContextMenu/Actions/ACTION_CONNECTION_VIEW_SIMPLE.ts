/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_VIEW_SIMPLE = createAction(
  'connection-view-simple',
  {
    label: 'app_navigationTree_connection_view_option_simple',
    type: 'select',
  }
);
