/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NAV_NODE_TYPE_FOLDER, type NavNode } from '@cloudbeaver/core-navigation-tree';

export function isFolderNode(node: NavNode): boolean {
  return node.nodeType === NAV_NODE_TYPE_FOLDER;
}
