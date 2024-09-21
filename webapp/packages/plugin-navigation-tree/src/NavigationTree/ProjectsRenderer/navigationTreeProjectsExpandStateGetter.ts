/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT, ProjectsService } from '@cloudbeaver/core-projects';

import type { IElementsTreeNodeExpandInfoGetter } from '../ElementsTree/useElementsTree.js';

export function navigationTreeProjectsExpandStateGetter(
  navNodeInfoResource: NavNodeInfoResource,
  projectsService: ProjectsService,
  projectsNavNodeService: ProjectsNavNodeService,
): IElementsTreeNodeExpandInfoGetter {
  return (tree, nodeId) => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType !== NAV_NODE_TYPE_PROJECT) {
      return null;
    }

    let active = false;
    const project = projectsNavNodeService.getByNodeId(nodeId);
    if (project) {
      active = projectsService.activeProjects.includes(project);
    }

    return {
      expanded: active,
      expandable: false,
    };
  };
}
