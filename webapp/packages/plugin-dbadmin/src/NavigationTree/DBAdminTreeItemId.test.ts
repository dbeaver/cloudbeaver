/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test } from 'vitest';

import type { DBAdminManager } from '../DBAdminManager.js';
import { createDBAdminTreeItemId, parseDBAdminTreeItemId } from './DBAdminTreeItemId.js';

const adminNodeId = 'node://g_GlobalConfiguration/datasources/warehousepg-1/folderAdmin';

describe('DBAdminTreeItemId', () => {
  test('round-trips the Administer folder and the manager', () => {
    for (const manager of ['sessions', 'locks'] satisfies DBAdminManager[]) {
      expect(parseDBAdminTreeItemId(createDBAdminTreeItemId({ adminNodeId, manager }))).toEqual({ adminNodeId, manager });
    }
  });

  test('ignores regular navigator node IDs', () => {
    expect(parseDBAdminTreeItemId(adminNodeId)).toBeNull();
    expect(parseDBAdminTreeItemId(`${adminNodeId}#dbadmin:ddl`)).toBeNull();
  });
});
