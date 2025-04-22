/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_TREE_CREATE_CONNECTION = createAction('create-tree-connection', {
  label: 'plugin_connections_connection_create_menu_title',
  tooltip: 'plugin_connections_connection_create_menu_title',
});
