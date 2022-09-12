/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { NAV_NODE_TYPE_PROJECT } from './NAV_NODE_TYPE_PROJECT';
import { ProjectInfo, ProjectInfoResource } from './ProjectInfoResource';

@injectable()
export class ProjectsNavNodeService {

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectsResource: ProjectInfoResource
  ) {
  }

  getProject(nodeId: string): ProjectInfo | undefined {
    const parentIds = [...this.navNodeInfoResource.getParents(nodeId), nodeId];
    const parents = this.navNodeInfoResource.get(resourceKeyList(parentIds));

    const projectNode = parents.find(parent => parent?.nodeType === NAV_NODE_TYPE_PROJECT);

    if (!projectNode) {
      return;
    }

    return this.getByNodeId(projectNode.id);
  }

  getByNodeId(nodeId: string): ProjectInfo | undefined {
    return this.projectsResource.get(nodeId.replace('resource://', ''));
  }

  getProjectNodeId(projectId: string): string {
    return `resource://${projectId}`;
  }
}