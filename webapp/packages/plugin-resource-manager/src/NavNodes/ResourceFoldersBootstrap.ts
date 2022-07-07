/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ENodeMoveType, getNodesFromContext, INodeMoveData, NavNodeManagerService, navNodeMoveContext, NavTreeResource } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { ProjectsResource } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { createPath } from '@cloudbeaver/core-utils';

import { NAV_NODE_TYPE_RM_PROJECT } from '../NAV_NODE_TYPE_RM_PROJECT';
import { NavResourceNodeService } from '../NavResourceNodeService';
import { IResourceManagerParams, ResourceManagerResource } from '../ResourceManagerResource';
import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';
import { NAV_NODE_TYPE_RM_RESOURCE } from './NAV_NODE_TYPE_RM_RESOURCE';

@injectable()
export class ResourceFoldersBootstrap extends Bootstrap {

  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly navResourceNodeService: NavResourceNodeService,
    private readonly resourceManagerResource: ResourceManagerResource,
    private readonly projectsResource: ProjectsResource
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.navNodeManagerService.onMove.addHandler(this.moveConnectionToFolder.bind(this));
  }
  load(): void | Promise<void> { }


  private async moveConnectionToFolder(
    {
      type,
      targetNode,
      moveContexts,
    }: INodeMoveData,
    contexts: IExecutionContextProvider<INodeMoveData>
  ) {
    const move = contexts.getContext(navNodeMoveContext);
    const nodes = getNodesFromContext(moveContexts);
    const nodeIdList = nodes.map(node => node.id);
    const children = this.navTreeResource.get(targetNode.id);

    const data = this.navResourceNodeService.getResourceData(targetNode.id);
    await this.projectsResource.load();
    const projectPath = createPath(RESOURCES_NODE_PATH, this.projectsResource.userProject?.name);

    if (!(this.projectsResource.userProject?.name === data.projectId)) {
      return;
    }

    const supported = (
      (
        [NAV_NODE_TYPE_RM_PROJECT, NAV_NODE_TYPE_RM_RESOURCE].includes(targetNode.nodeType!)
        || targetNode.id === projectPath
      )
      && (targetNode.folder || NAV_NODE_TYPE_RM_PROJECT === targetNode.nodeType)
      && nodes.every(node => (
        node.nodeType === NAV_NODE_TYPE_RM_RESOURCE
        && !children?.includes(node.id)
      ))
    );

    if (!supported) {
      return;
    }

    if (type === ENodeMoveType.CanDrop && targetNode.nodeType) {
      move.setCanMove(true);
    } else {
      await this.navTreeResource.moveTo(resourceKeyList(nodeIdList), targetNode.id);
      await this.navTreeResource.refreshTree(RESOURCES_NODE_PATH);

      const parents: IResourceManagerParams[] = Array.from(new Set<IResourceManagerParams>([
        { projectId: data.projectId, folder: data.folder },
        ...nodes.map(node => {
          const data = this.navResourceNodeService.getResourceData(node.id);

          return { projectId: data.projectId, folder: data.folder };
        }),
      ]));

      this.resourceManagerResource.markOutdated(resourceKeyList(parents));
    }
  }
}