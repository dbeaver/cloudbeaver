/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NAV_NODE_TYPE_PROJECT, NODE_PATH_TEMPLATE_RESOURCE_PROJECT, ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { PathTemplate, testPath } from '@cloudbeaver/core-utils';

import { NavNodeInfoResource } from './NavNodeInfoResource';

export interface IProjectPathTemplateParams {
  projectId: string;
}

@injectable()
export class ProjectsNavNodeService {
  projectTypes: string[];
  projectPathTemplates: PathTemplate<IProjectPathTemplateParams>[];

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectInfoResource: ProjectInfoResource
  ) {
    this.projectTypes = [NAV_NODE_TYPE_PROJECT];
    this.projectPathTemplates = [NODE_PATH_TEMPLATE_RESOURCE_PROJECT];
  }

  addProjectType(type: string): void {
    this.projectTypes.push(type);
  }

  addProjectPathTemplate(template: PathTemplate<IProjectPathTemplateParams>): void {
    this.projectPathTemplates.push(template);
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
    for (const template of this.projectPathTemplates) {
      const match = testPath(template, nodeId, true);
      if (match) {
        return this.projectInfoResource.get(match.projectId);
      }
    }
    return undefined;
  }
}