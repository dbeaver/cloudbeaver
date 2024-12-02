/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { IElementsTreeCustomNodeInfo } from './useElementsTree.js';

export function transformFilteredNodeInfo(navNodeInfoResource: NavNodeInfoResource): IElementsTreeCustomNodeInfo {
  return function transformFilteredNodeInfo(nodeId, info) {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.filtered) {
      return {
        ...info,
        name: info.name + ' (...)',
      };
    }
    return info;
  };
}
