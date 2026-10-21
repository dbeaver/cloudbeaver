/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';

export function isScopeLeaf(node: NavNode): boolean {
  return node.objectFeatures.includes(EObjectFeature.entity) || !node.hasChildren;
}
