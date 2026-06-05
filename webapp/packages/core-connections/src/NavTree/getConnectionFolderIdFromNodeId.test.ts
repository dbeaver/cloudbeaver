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
  const node: NavNode = {
    uri: '',
    folder: true,
    hasChildren: false,
    inline: false,
    navigable: false,
    filtered: false,
    objectFeatures: [],
    nodeType: NAV_NODE_TYPE_FOLDER,
  };

  test('should extract projectId and folderId from a valid nodeId', () => {
    const id = 'node://u_cbadmin/datasources/QAtestRegress';
    node.uri = id;
    expect(getConnectionFolderIdFromNodeId(node)).toEqual({ projectId: 'u_cbadmin', folderId: 'QAtestRegress' });
  });

  test('should return undefined for non-folder ids', () => {
    const id = 'node://u_cbadmin/datasources/QAtestRegress';

    node.uri = id;
    node.folder = false;
    delete node.nodeType;

    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });

  test('should return undefined when an empty string is passed', () => {
    const id = '';
    node.uri = id;
    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });

  test('should return undefined if no projectId and folderId', () => {
    const id = 'node://';
    node.uri = id;
    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });

  test('should return undefined if folderId is not passed', () => {
    const id = 'node://u_cbadmin/';
    node.uri = id;
    expect(getConnectionFolderIdFromNodeId(node)).toEqual(undefined);
  });
});
