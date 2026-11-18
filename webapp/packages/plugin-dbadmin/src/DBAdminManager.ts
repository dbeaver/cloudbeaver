/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/** Server administration tool that a database administration tab shows */
export type DBAdminManager = 'sessions' | 'locks';

export function isDBAdminManager(value: unknown): value is DBAdminManager {
  return value === 'sessions' || value === 'locks';
}

/** Navigator folder ID of the "Administer" folder in DBeaver database models */
export const NAV_NODE_ADMIN_FOLDER_ID = 'folderAdmin';
