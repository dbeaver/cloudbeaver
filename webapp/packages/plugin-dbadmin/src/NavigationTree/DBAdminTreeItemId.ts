/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type DBAdminManager, isDBAdminManager } from '../DBAdminManager.js';

/** Navigator tree item that opens a manager of an "Administer" folder */
export interface IDBAdminTreeItem {
  /** ID of the "Administer" folder node */
  adminNodeId: string;
  manager: DBAdminManager;
}

const SEPARATOR = '#dbadmin:';

export function createDBAdminTreeItemId(item: IDBAdminTreeItem): string {
  return `${item.adminNodeId}${SEPARATOR}${item.manager}`;
}

export function parseDBAdminTreeItemId(id: string): IDBAdminTreeItem | null {
  const index = id.lastIndexOf(SEPARATOR);

  if (index === -1) {
    return null;
  }

  const manager = id.slice(index + SEPARATOR.length);

  if (!isDBAdminManager(manager)) {
    return null;
  }

  return { adminNodeId: id.slice(0, index), manager };
}
