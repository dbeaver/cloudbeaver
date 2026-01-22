/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_VIEW_RESET = createAction('connection-view-reset', {
  label: 'plugin_connection_view_reset',
  tooltip: 'plugin_connection_view_option_reset_description',
});
