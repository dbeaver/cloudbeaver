/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, test } from 'vitest';
import { NAV_NODE_TYPE_FOLDER, type NavNode } from '@cloudbeaver/core-navigation-tree';

import { getConnectionFolderIdFromNodeId } from './getConnectionFolderIdFromNodeId.js';

describe('getConnectionFolderIdFromNodeId', () => {
  const getNode = (overrides: Partial<NavNode> = {}): NavNode => ({
    uri: '',
    folder: true,
    hasChildren: false,
    inline: false,
    navigable: false,
    filtered: false,
    objectFeatures: [],
    nodeType: NAV_NODE_TYPE_FOLDER,
    ...overrides,
  });

  test('should extract projectId and folderId from a valid nodeId', () => {
    const node = getNode({ uri: 'node://u_cbadmin/datasources/QAtestRegress' });
    expect(getConnectionFolderIdFromNodeId(node)).toEqual({ projectId: 'u_cbadmin', folderId: 'QAtestRegress' });
  });

  test('should return undefined for non-folder ids', () => {
    const node = getNode({
      uri: 'node://u_cbadmin/datasources/QAtestRegress',
      folder: false,
      nodeType: undefined,
    });

    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });

  test('should return undefined when an empty string is passed', () => {
    const node = getNode({ uri: '' });
    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });

  test('should return undefined if no projectId and folderId', () => {
    const node = getNode({ uri: 'node://' });
    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });

  test('should return undefined if folderId is not passed', () => {
    const node = getNode({ uri: 'node://u_cbadmin/' });
    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });
});
