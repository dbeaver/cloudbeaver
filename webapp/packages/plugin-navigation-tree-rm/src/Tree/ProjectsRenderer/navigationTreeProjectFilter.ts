/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode, NavNodeInfoResource, NavTreeResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import type { ProjectsService } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { isRMProjectNode, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';
import type { IElementsTreeFilter } from '@cloudbeaver/plugin-navigation-tree';
import type { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

export function navigationTreeProjectFilter(
  projectsNavNodeService: ProjectsNavNodeService,
  projectsService: ProjectsService,
  navNodeInfoResource: NavNodeInfoResource,
  navTreeResource: NavTreeResource,
  resourceManagerService: ResourceManagerService,
  resourceTypeId?: string,
): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    if (isRMProjectNode(node) && resourceTypeId !== undefined) {
      const project = projectsNavNodeService.getProject(node.id);

      if (!project) {
        return children;
      }

      const resourceFolder = resourceManagerService.getRootFolder(project, resourceTypeId);

      if (resourceFolder === undefined) {
        return children;
      }

      const folderNodeId = createPath(RESOURCES_NODE_PATH, project.id, resourceFolder);

      const nodes = navNodeInfoResource
        .get(resourceKeyList(children))
        .filter(isDefined)
        .filter(node => {
          if (node.id === folderNodeId) {
            return navTreeResource.get(node.id)?.length;
          }
          return false;
        })
        .map(node => node.id);

      return nodes;
    }

    if (node.id !== RESOURCES_NODE_PATH) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter<NavNode>((node => node !== undefined) as (node: NavNode | undefined) => node is NavNode)
      .filter(node => {
        if (isRMProjectNode(node)) {
          const project = projectsNavNodeService.getProject(node.id);

          if (!project || !projectsService.activeProjects.includes(project)) {
            return false;
          }

          if (resourceTypeId) {
            const resourceFolder = resourceManagerService.getRootFolder(project, resourceTypeId);

            const folderNodeId = createPath(RESOURCES_NODE_PATH, project.id, resourceFolder);
            return (navTreeResource.get(folderNodeId)?.length || 0) > 0;
          }

          return (navTreeResource.get(node.id)?.length || 0) > 0;
        }
        return true;
      })
      .map(node => node.id);

    return nodes;
  };
}
