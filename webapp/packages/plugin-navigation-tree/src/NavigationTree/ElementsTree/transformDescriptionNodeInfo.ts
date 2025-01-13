/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTreeCustomNodeInfo } from './useElementsTree.js';

export function transformDescriptionNodeInfo(navNodeInfoResource: NavNodeInfoResource): IElementsTreeCustomNodeInfo {
  return function transformDescriptionNodeInfo(nodeId, info) {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.description && !node.folder) {
      return {
        ...info,
        description: node.description,
      };
    }

    return info;
  };
}
