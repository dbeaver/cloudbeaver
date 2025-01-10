/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { isRMResourceNode } from '@cloudbeaver/core-resource-manager';
import type { IElementsTreeCustomNodeInfo } from '@cloudbeaver/plugin-navigation-tree';

export function transformResourceNodeInfo(
  projectInfoResource: ProjectInfoResource,
  projectsNavNodeService: ProjectsNavNodeService,
  navNodeInfoResource: NavNodeInfoResource,
  resourceTypeId: string | undefined,
): IElementsTreeCustomNodeInfo {
  return function transformResourceNodeInfo(nodeId, info) {
    const node = navNodeInfoResource.get(nodeId);
    if (node && isRMResourceNode(node) && resourceTypeId) {
      const project = projectsNavNodeService.getProject(node.id);

      if (project) {
        return {
          ...info,
          name: projectInfoResource.getNameWithoutExtension(project.id, resourceTypeId, info.name),
        };
      }
    }
    return info;
  };
}
