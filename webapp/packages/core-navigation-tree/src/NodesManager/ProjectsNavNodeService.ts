/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NAV_NODE_TYPE_PROJECT, type ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';

import { NavNodeInfoResource } from './NavNodeInfoResource.js';

export class ProjectsNavNodeServiceImpl {
  projectTypes: string[];
  projectPrefixes: string[];

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    this.projectTypes = [NAV_NODE_TYPE_PROJECT];
    this.projectPrefixes = ['node://'];
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

    return this.getByNodeId(projectNode.uri);
  }

  getByNodeId(nodeId: string): ProjectInfo | undefined {
    return this.projectInfoResource.get(this.projectPrefixes.reduce((nodeId, prefix) => nodeId.replace(prefix, ''), nodeId));
  }
}

export type ProjectsNavNodeService = ProjectsNavNodeServiceImpl;

export class ProjectsNavNodeServiceDI extends Context.Service<ProjectsNavNodeServiceDI, ProjectsNavNodeServiceImpl>()(
  '@cloudbeaver/core-navigation-tree/NodesManager/ProjectsNavNodeService#ProjectsNavNodeService',
) {
  static readonly implementation = ProjectsNavNodeServiceImpl;

  static readonly dependencies = () => [NavNodeInfoResource, ProjectInfoResource] as const;
  static readonly make: Effect.Effect<
    ProjectsNavNodeServiceImpl,
    never,
    Context.Service.Identifier<typeof NavNodeInfoResource> | Context.Service.Identifier<typeof ProjectInfoResource>
  > = Effect.gen(function* makeProjectsNavNodeService() {
    const navNodeInfoResource = yield* NavNodeInfoResource;
    const projectInfoResource = yield* ProjectInfoResource;

    return new ProjectsNavNodeServiceImpl(navNodeInfoResource, projectInfoResource);
  });
  static readonly layer: Layer.Layer<
    ProjectsNavNodeServiceDI,
    never,
    Context.Service.Identifier<typeof NavNodeInfoResource> | Context.Service.Identifier<typeof ProjectInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProjectsNavNodeService = ProjectsNavNodeServiceDI;
