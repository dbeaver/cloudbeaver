/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode } from '@cloudbeaver/core-navigation-tree';
import { RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';

/** Matches a resource-type root folder displayed as a project row, not its descendants. */
export function isResourceTypeRootFolder(node: NavNode | undefined, projectId: string, root: string | undefined): boolean {
  if (!node?.folder || root === undefined) {
    return false;
  }

  return node.uri === createPath(RESOURCES_NODE_PATH, projectId, root);
}
