/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT } from '@cloudbeaver/core-projects';

import type { IElementsTreeNodeExpandInfoGetter } from '../ElementsTree/useElementsTree';


export function navigationTreeProjectsExpandStateGetter(
  navNodeInfoResource: NavNodeInfoResource
): IElementsTreeNodeExpandInfoGetter {

  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType !== NAV_NODE_TYPE_PROJECT) {
      return null;
    }

    return {
      expanded: true,
      expandable: false,
    };
  };
}