/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';
import { IDNDBox, useDNDBox } from '@cloudbeaver/core-ui';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavNodeManagerService, ENodeMoveType } from '../shared/NodesManager/NavNodeManagerService';
import { navNodeMoveContext } from '../shared/NodesManager/navNodeMoveContext';

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

      const contexts = navNodeManagerService.onMove.execute({
        type: ENodeMoveType.CanDrop,
        targetNode,
        moveContexts,
      });

      const move = contexts.getContext(navNodeMoveContext);

      return move.canMove;
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
    onHover() {
      if (!nodeState?.expanded) {
        nodeState?.expand();
      }
    },
  });

  return dndBox;
}