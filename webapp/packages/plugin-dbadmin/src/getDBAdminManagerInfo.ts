/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DBAdminManager } from './DBAdminManager.js';

export function getDBAdminManagerTitle(manager: DBAdminManager): string {
  return manager === 'sessions' ? 'plugin_dbadmin_session_manager' : 'plugin_dbadmin_lock_manager';
}

export function getDBAdminManagerIcon(manager: DBAdminManager): string {
  return manager === 'sessions'
    ? 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/sessions.svg'
    : 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/locked.svg';
}
