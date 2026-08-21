/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NODE_DATASOURCES_SEGMENT, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { getPathParts } from '@cloudbeaver/core-utils';

import { getConnectionParentId } from './getConnectionParentId.js';

export function getConnectionFolderParentId(projectId: string, nodeId: string, parentId?: string): string {
  if (parentId) {
    return parentId;
  }

  const segments = getPathParts(NodeManagerUtils.getPlainPath(nodeId));
  if (segments[0] !== projectId || segments[1] !== NODE_DATASOURCES_SEGMENT) {
    return getConnectionParentId(projectId);
  }

  const folder = segments.slice(2, -1).join('/');
  return getConnectionParentId(projectId, folder || undefined);
}
