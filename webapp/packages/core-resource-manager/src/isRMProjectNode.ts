/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import { NAV_NODE_TYPE_RM_PROJECT } from './NAV_NODE_TYPE_RM_PROJECT.js';

export function isRMProjectNode(node: NavNode | undefined) {
  return node?.nodeType === NAV_NODE_TYPE_RM_PROJECT;
}
