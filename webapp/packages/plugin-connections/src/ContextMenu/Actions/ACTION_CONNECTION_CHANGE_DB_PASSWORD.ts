/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createAction } from '@cloudbeaver/core-view';

export const ACTION_CONNECTION_CHANGE_DB_PASSWORD = createAction('connection-change-db-password', {
  label: 'plugin_connections_change_db_password_menu_title',
  icon: '/icons/key.svg',
});
