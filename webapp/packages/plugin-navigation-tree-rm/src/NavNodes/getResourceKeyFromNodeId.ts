/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getRmResourcePath, isRMNavNode } from '@cloudbeaver/core-resource-manager';
import { createPath, getPathParts } from '@cloudbeaver/core-utils';

export function getResourceKeyFromNodeId(nodeId: string): string | undefined {
  if (!isRMNavNode(nodeId)) {
    return;
  }

  const parts = getPathParts(nodeId.replace('//', '\\'));
  const projectId = parts[1]!;
  const path = createPath(...parts.slice(2, parts.length - 1));
  let name: string | undefined;

  if (parts.length > 2) {
    name = parts[parts.length - 1];
  }

  return getRmResourcePath(projectId, createPath(path, name));
}
