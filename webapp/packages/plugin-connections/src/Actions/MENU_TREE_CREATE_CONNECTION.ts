/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createMenu } from '@cloudbeaver/core-view';

export const MENU_TREE_CREATE_CONNECTION = createMenu('create-tree-connection', {
  label: 'plugin_connections_connection_create_menu_title',
  icon: '/icons/plugin_connection_new_sm.svg',
  tooltip: 'plugin_connections_connection_create_menu_title',
  group: true,
});
