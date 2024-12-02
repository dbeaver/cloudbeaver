/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode } from '@cloudbeaver/core-navigation-tree';

import type { INavTreeNodeInfo } from './INavTreeNodeInfo.js';
import type { IElementsTreeCustomNodeInfo } from './useElementsTree.js';

export function transformNodeInfo(node: NavNode, transformers: IElementsTreeCustomNodeInfo[]): INavTreeNodeInfo {
  return transformers.reduce((info, transformer) => transformer(node.id, info), {
    name: node.name,
    tooltip: node.name,
    icon: node.icon,
  } as INavTreeNodeInfo);
}
