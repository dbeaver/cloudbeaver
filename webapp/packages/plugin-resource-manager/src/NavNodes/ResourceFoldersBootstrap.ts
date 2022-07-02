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
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { NAV_NODE_TYPE_RM_PROJECT } from '../NAV_NODE_TYPE_RM_PROJECT';
import { NAV_NODE_TYPE_RM_RESOURCE } from './NAV_NODE_TYPE_RM_RESOURCE';

@injectable()
export class ResourceFoldersBootstrap extends Bootstrap {

  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly navNodeManagerService: NavNodeManagerService
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
    const children = this.navTreeResource.get(targetNode.id);

    if (type === ENodeMoveType.CanDrop && targetNode.nodeType) {
      if (
        [NAV_NODE_TYPE_RM_PROJECT, NAV_NODE_TYPE_RM_RESOURCE].includes(targetNode.nodeType)
        && targetNode.folder
        && nodes.every(node => (
          node.nodeType === NAV_NODE_TYPE_RM_RESOURCE
          && !children?.includes(node.id)
        ))
      ) {
        move.setCanMove(true);
      }
    } else {
      const parents = Array.from(new Set([targetNode.id, ...nodes.map(node => node.parentId)]));
      // move to folder
      this.navTreeResource.markOutdated(resourceKeyList(parents));
      // or make refresh for parents
    }
  }
}