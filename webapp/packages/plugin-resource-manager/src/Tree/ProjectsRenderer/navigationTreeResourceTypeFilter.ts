/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource, isResourceOfType } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_RESOURCE } from '@cloudbeaver/core-resource-manager';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import type { IElementsTreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import type { ResourcesProjectsNavNodeService } from '../../NavNodes/ResourcesProjectsNavNodeService';

export function navigationTreeResourceTypeFilter(
  navNodeInfoResource: NavNodeInfoResource,
  resourcesProjectsNavNodeService: ResourcesProjectsNavNodeService,
  projectInfoResource: ProjectInfoResource,
  resourceTypeId?: string,
): IElementsTreeFilter {
  return (filter: string, node: NavNode, children: string[]) => {
    if (resourceTypeId === undefined) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter<NavNode>((node => node !== undefined) as (node: NavNode | undefined) => node is NavNode)
      .filter(node => {
        if (node.nodeType === NAV_NODE_TYPE_RM_RESOURCE) {
          if (node.folder) {
            return true;
          }

          const project = resourcesProjectsNavNodeService.getProject(node.id);

          if (project) {
            const resourceType = projectInfoResource.getResourceType(project, resourceTypeId);

            if (resourceType) {
              return isResourceOfType(resourceType, node.id);
            }
          }
          return false;
        }
        return true;
      })
      .map(node => node.id);

    return nodes;
  };
}
