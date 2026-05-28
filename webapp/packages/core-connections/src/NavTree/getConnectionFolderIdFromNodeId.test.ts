/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test } from 'vitest';

import { getConnectionFolderIdFromNodeId } from './getConnectionFolderIdFromNodeId.js';

describe('getConnectionFolderIdFromNodeId', () => {
  test('should extract projectId and folderId from a valid folder:// nodeId', () => {
    const id = 'folder://u_cbadmin/QAtestRegress';
    expect(getConnectionFolderIdFromNodeId(id)).toEqual({ projectId: 'u_cbadmin', folderId: 'QAtestRegress' });
  });

  test('should return undefined for non-folder ids', () => {
    const id = 'ext://resources/g_GlobalConfiguration/Aleksandr';
    expect(getConnectionFolderIdFromNodeId(id)).toEqual(undefined);
  });

  test('should return undefined when an empty string is passed', () => {
    const id = '';
    expect(getConnectionFolderIdFromNodeId(id)).toEqual(undefined);
  });

  test('should return undefined if no projectId and folderId', () => {
    const id = 'folder://';
    expect(getConnectionFolderIdFromNodeId(id)).toEqual(undefined);
  });

  test('should return undefined if folderId is not passed', () => {
    const id = 'folder://u_cbadmin/';
    expect(getConnectionFolderIdFromNodeId(id)).toEqual({
      projectId: 'u_cbadmin',
      folderId: '',
    });
  });
});
