/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import type { IElementsTreeNodeExpandInfoGetter } from '@cloudbeaver/plugin-navigation-tree';

import { NAV_NODE_TYPE_RM_PROJECT } from '../../NAV_NODE_TYPE_RM_PROJECT';


export function navigationTreeProjectsExpandStateGetter(
  navNodeInfoResource: NavNodeInfoResource
): IElementsTreeNodeExpandInfoGetter {

  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType !== NAV_NODE_TYPE_RM_PROJECT) {
      return null;
    }

    return {
      expanded: true,
      expandable: false,
    };
  };
}