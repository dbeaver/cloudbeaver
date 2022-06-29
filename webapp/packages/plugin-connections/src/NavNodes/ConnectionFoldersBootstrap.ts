/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ENodeMoveType, getNodesFromContext, INodeMoveData, NavNodeManagerService, navNodeMoveContext, NavTreeResource, NAV_NODE_TYPE_FOLDER, NAV_NODE_TYPE_ROOT } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { NAV_NODE_TYPE_CONNECTION } from './NAV_NODE_TYPE_CONNECTION';

@injectable()
export class ConnectionFoldersBootstrap extends Bootstrap {

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


  private moveConnectionToFolder(
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
        [NAV_NODE_TYPE_ROOT, NAV_NODE_TYPE_FOLDER].includes(targetNode.nodeType)
        && nodes.every(node => (
          node.nodeType === NAV_NODE_TYPE_CONNECTION
          && !children?.includes(node.id)
        ))
      ) {
        move.setCanMove(true);
      }
    } else {
      console.log(targetNode.id, nodes.map(node => node.id));
    }
  }
}