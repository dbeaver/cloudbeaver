/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isConnectionFolder, NODE_DATASOURCES_SEGMENT, NodeManagerUtils, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { getPathParts } from '@cloudbeaver/core-utils';

import type { IConnectionFolderParam } from '../ConnectionFolderResource.js';
import { createConnectionFolderParam } from '../createConnectionFolderParam.js';

export function getConnectionFolderIdFromNodeId(node: NavNode): IConnectionFolderParam | undefined {
  if (!isConnectionFolder(node)) {
    return;
  }

  const segments = getPathParts(NodeManagerUtils.getPlainPath(node.uri));

  if (segments[1] === NODE_DATASOURCES_SEGMENT) {
    segments.splice(1, 1);
  }

  const projectId = segments[0];
  const folderId = segments.slice(1).join('/');

  if (!projectId || !folderId) {
    return;
  }

  return createConnectionFolderParam(projectId, folderId);
}
