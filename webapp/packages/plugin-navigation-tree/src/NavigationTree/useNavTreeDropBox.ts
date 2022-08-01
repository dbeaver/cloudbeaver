/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useStateDelay } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type NavNode, NavNodeManagerService, ENodeMoveType } from '@cloudbeaver/core-navigation-tree';
import { IDNDBox, useDNDBox } from '@cloudbeaver/core-ui';


interface INodeState {
  expanded: boolean;
  expand: () => void;
}

export function useNavTreeDropBox(targetNode: NavNode | undefined, nodeState?: INodeState): IDNDBox {
  const navNodeManagerService = useService(NavNodeManagerService);
  const dndBox = useDNDBox({
    canDrop(moveContexts) {
      if (!targetNode) {
        return false;
      }

      navNodeManagerService.canMove(
        targetNode,
        moveContexts,
      );

      return navNodeManagerService.getNavNodeCache(targetNode.id).canMove;
    },
    onDrop(moveContexts) {
      if (targetNode) {
        navNodeManagerService.onMove.execute({
          type: ENodeMoveType.Drop,
          targetNode,
          moveContexts,
        });
      }
    },
  });

  const hover = useStateDelay(dndBox.state.isOverCurrent && dndBox.state.canDrop, 600);

  useEffect(() => {
    if (dndBox.state.isOverCurrent && dndBox.state.canDrop && !nodeState?.expanded) {
      nodeState?.expand();
    }
  }, [hover]);

  return dndBox;
}