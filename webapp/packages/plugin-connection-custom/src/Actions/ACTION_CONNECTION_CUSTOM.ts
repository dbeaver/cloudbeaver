/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_CUSTOM = createAction('connection-custom', {
  label: 'plugin_connection_custom_action_custom_label',
  tooltip: 'plugin_connection_custom_action_custom_tooltip',
});
