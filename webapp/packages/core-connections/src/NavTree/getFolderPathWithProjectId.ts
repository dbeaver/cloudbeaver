/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NODE_DATASOURCES_SEGMENT, NodeManagerUtils, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { getPathParts } from '@cloudbeaver/core-utils';

import { isFolderNode } from './isFolderNode.js';

export function getFolderPathWithProjectId(node: NavNode): string {
  if (!isFolderNode(node)) {
    throw new Error('Invalid folder id');
  }

  const path = getPathParts(NodeManagerUtils.getPlainPath(node.uri));

  if (path[1] === NODE_DATASOURCES_SEGMENT) {
    path.splice(1, 1);
  }

  return path.join('/');
}
