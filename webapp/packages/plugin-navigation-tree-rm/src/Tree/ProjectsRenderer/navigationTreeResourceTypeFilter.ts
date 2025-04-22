/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode, NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { isResourceOfType, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { isRMResourceNode } from '@cloudbeaver/core-resource-manager';
import { isNotNullDefined } from '@dbeaver/js-helpers';
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
      .filter<NavNode>(isNotNullDefined)
      .filter(node => {
        if (isRMResourceNode(node)) {
          if (node.folder) {
            return true;
          }

          const project = projectsNavNodeService.getProject(node.id);

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
