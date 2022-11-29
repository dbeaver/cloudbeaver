/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getProjectNodeId, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';

import { isFolderNodeId } from './isFolderNodeId';

export function getFolderNodeParents(nodeId: string): string[] {
  if (isFolderNodeId(nodeId)) {
    const parents = NodeManagerUtils.parentsFromPath(nodeId);

    return [getProjectNodeId(parents[0].replace('folder://', '')), ...parents.slice(1)];
  }

  return [];
}