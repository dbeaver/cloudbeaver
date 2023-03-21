/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNode, NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfoResource, isResourceOfType } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_RESOURCE } from '@cloudbeaver/core-resource-manager';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { filterUndefined } from '@cloudbeaver/core-utils';
import type { IElementsTreeFilter } from '@cloudbeaver/plugin-navigation-tree';

export function navigationTreeResourceTypeFilter(
  navNodeInfoResource: NavNodeInfoResource,
  projectsNavNodeService: ProjectsNavNodeService,
  projectInfoResource: ProjectInfoResource,
  resourceTypeId?: string,
): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    if (resourceTypeId === undefined) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter<NavNode>(filterUndefined)
      .filter(node => {
        if (node.nodeType === NAV_NODE_TYPE_RM_RESOURCE) {
          if (node.folder) {
            return true;
          }

          const project = projectsNavNodeService.getByNodeId(node.id);

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
