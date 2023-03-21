/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { getRmNodeId } from '@cloudbeaver/core-resource-manager';
import type { IElementsTreeNodeExpandInfoGetter } from '@cloudbeaver/plugin-navigation-tree';

import type { ResourceManagerService } from '../../ResourceManagerService';

export function navigationTreeResourceExpandStateGetter(
  navNodeInfoResource: NavNodeInfoResource,
  resourceManagerService: ResourceManagerService,
  projectsNavNodeService: ProjectsNavNodeService,
  resourceTypeId?: string,
): IElementsTreeNodeExpandInfoGetter {

  return (tree, nodeId) => {
    const node = navNodeInfoResource.get(nodeId);

    if (!node?.folder || resourceTypeId === undefined) {
      return null;
    }

    const project = projectsNavNodeService.getByNodeId(nodeId);

    if (!project) {
      return null;
    }

    const resourceFolder = resourceManagerService.getRootFolder(project, resourceTypeId);
    const folderNodeId = getRmNodeId(project.id, resourceFolder);

    if (nodeId !== folderNodeId) {
      return null;
    }

    return {
      expanded: true,
      expandable: false,
    };
  };
}