/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { createPath } from '@cloudbeaver/core-utils';

import { NAV_NODE_TYPE_RM_PROJECT } from '../NAV_NODE_TYPE_RM_PROJECT';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';

@injectable()
export class ResourcesProjectsNavNodeService {

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectInfoResource: ProjectInfoResource
  ) {
  }

  getProject(nodeId: string): ProjectInfo | undefined {
    const parentIds = [...this.navNodeInfoResource.getParents(nodeId), nodeId];
    const parents = this.navNodeInfoResource.get(resourceKeyList(parentIds));

    const projectNode = parents.find(parent => parent?.nodeType === NAV_NODE_TYPE_RM_PROJECT);

    if (!projectNode) {
      return;
    }

    return this.getByNodeId(projectNode.id);
  }

  getByNodeId(nodeId: string): ProjectInfo | undefined {
    return this.projectInfoResource.get(nodeId.replace(RESOURCES_NODE_PATH + '/', ''));
  }

  getProjectNodeId(projectId: string): string {
    return createPath(RESOURCES_NODE_PATH, projectId);
  }
}