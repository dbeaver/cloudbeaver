/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavigationTreeService } from './NavigationTreeService';

interface INavigationTree {
  isSelected: (node: NavNode) => boolean;
  handleOpen: (node: NavNode) => Promise<void>;
  handleSelect: (node: NavNode, isMultiple: boolean) => boolean;
}

export function useNavigationTree(): INavigationTree {
  const navigationTreeService = useService(NavigationTreeService);

  const handleOpen = useCallback(
    (node: NavNode) => navigationTreeService.navToNode(node.id, node.parentId),
    [navigationTreeService]
  );

  const handleSelect = useCallback(
    (node: NavNode, multiple: boolean) => navigationTreeService.selectNode(node.id, multiple),
    [navigationTreeService]);

  const isSelected = useCallback(
    (node: NavNode) => navigationTreeService.isNodeSelected(node.id),
    [navigationTreeService]
  );

  return {
    isSelected,
    handleOpen,
    handleSelect,
  };
}
