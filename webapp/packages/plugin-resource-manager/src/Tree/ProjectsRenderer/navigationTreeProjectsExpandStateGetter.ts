/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import type { ProjectsService } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_PROJECT } from '@cloudbeaver/core-resource-manager';
import type { IElementsTreeNodeExpandInfoGetter } from '@cloudbeaver/plugin-navigation-tree';


export function navigationTreeProjectsExpandStateGetter(
  navNodeInfoResource: NavNodeInfoResource,
  projectsService: ProjectsService,
  projectsNavNodeService: ProjectsNavNodeService,
): IElementsTreeNodeExpandInfoGetter {

  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType !== NAV_NODE_TYPE_RM_PROJECT) {
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