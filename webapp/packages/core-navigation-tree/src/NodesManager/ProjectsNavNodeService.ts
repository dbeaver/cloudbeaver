/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NAV_NODE_TYPE_PROJECT, type ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';

import { NavNodeInfoResource } from './NavNodeInfoResource.js';

@injectable()
export class ProjectsNavNodeService {
  projectTypes: string[];
  projectPrefixes: string[];

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    this.projectTypes = [NAV_NODE_TYPE_PROJECT];
    this.projectPrefixes = ['resource://'];
  }

  addProjectType(type: string): void {
    this.projectTypes.push(type);
  }

  addProjectPrefix(prefix: string): void {
    this.projectPrefixes.push(prefix);
  }

  getProject(nodeId: string): ProjectInfo | undefined {
    const parentIds = [...this.navNodeInfoResource.getParents(nodeId), nodeId];
    const parents = this.navNodeInfoResource.get(resourceKeyList(parentIds));

    const projectNode = parents.find(parent => this.projectTypes.includes(parent?.nodeType || ''));

    if (!projectNode) {
      return;
    }

    return this.getByNodeId(projectNode.id);
  }

  getByNodeId(nodeId: string): ProjectInfo | undefined {
    return this.projectInfoResource.get(this.projectPrefixes.reduce((nodeId, prefix) => nodeId.replace(prefix, ''), nodeId));
  }
}
