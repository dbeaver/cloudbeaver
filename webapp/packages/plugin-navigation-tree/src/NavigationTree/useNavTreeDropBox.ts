/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useEffect } from 'react';

import { useStateDelay } from '@cloudbeaver/core-blocks';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { ENodeMoveType, type NavNode, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { type IDNDBox, useDNDBox } from '@cloudbeaver/core-ui';
import { throttleAsync } from '@cloudbeaver/core-utils';

interface INodeState {
  expanded: boolean;
  expand: () => void;
}

export function useNavTreeDropBox(targetNode: NavNode | undefined, nodeState?: INodeState): IDNDBox {
  const updateCanMove = useCallback(
    throttleAsync((targetNode: NavNode, moveContexts: IDataContextProvider) => navNodeManagerService.canMove(targetNode, moveContexts), 300),
    [],
  );
  const navNodeManagerService = useService(NavNodeManagerService);
  const dndBox = useDNDBox({
    canDrop(moveContexts) {
      if (!targetNode) {
        return false;
      }

      updateCanMove(targetNode, moveContexts).catch(() => {});

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
