/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


import type { NavNode, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import type { ProjectsService } from '@cloudbeaver/core-projects';
import { RESOURCES_NODE_PATH, NAV_NODE_TYPE_RM_PROJECT } from '@cloudbeaver/core-resource-manager';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import type { IElementsTreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import type { ResourcesProjectsNavNodeService } from '../../NavNodes/ResourcesProjectsNavNodeService';

export function navigationTreeProjectFilter(
  resourcesProjectsNavNodeService: ResourcesProjectsNavNodeService,
  projectsService: ProjectsService,
  navNodeInfoResource: NavNodeInfoResource,
  navTreeResource: NavTreeResource,
): IElementsTreeFilter {
  return (filter: string, node: NavNode, children: string[]) => {
    if (node.id !== RESOURCES_NODE_PATH) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter<NavNode>((node => node !== undefined) as (node: NavNode | undefined) => node is NavNode)
      .filter(node => {
        if (node.nodeType === NAV_NODE_TYPE_RM_PROJECT) {
          const project = resourcesProjectsNavNodeService.getProject(node.id);

          if (!project || !projectsService.activeProjects.includes(project)) {
            return false;
          }

          return navTreeResource.get(node.id)?.length;
        }
        return true;
      })
      .map(node => node.id);

    return nodes;
  };
}
