/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_SEARCH = createAction(
  'connection-search',
  {
    label: 'plugin_connection_search_action_search_label',
  }
);
