/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ENodeFeature, EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';

export function isScopeObject(node: NavNode | undefined): boolean {
  return !!node?.objectFeatures.some(feature => feature === ENodeFeature.objectContainer || feature === EObjectFeature.entity);
}
