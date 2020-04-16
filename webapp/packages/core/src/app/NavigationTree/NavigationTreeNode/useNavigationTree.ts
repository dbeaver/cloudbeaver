/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useCallback, useEffect } from 'react';

import { useService } from '@dbeaver/core/di';

import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { NodesManagerService } from '../../shared/NodesManager/NodesManagerService';
import { NodeWithParent } from '../../shared/NodesManager/NodeWithParent';
import { useNode } from '../../shared/NodesManager/useNode';
import { useChildren } from '../../shared/useChildren';
import { NavigationTreeService } from '../NavigationTreeService';


export function useNavigationTree(nodeId: string) {
  const navigationTreeService = useService(NavigationTreeService);
  const nodesManagerService = useService(NodesManagerService);
  const [isExpanded, switchExpand] = useState(false);
  const [isSelected, switchSelect] = useState(false);
  const node = useNode(nodeId);
  const children = useChildren(nodeId);

  if (!node) {
    return undefined;
  }

  const isLoaded = children?.isLoaded;
  const isExpandable = isExpandableFilter(node) && (!children?.isLoaded || children.children.length > 0);

  const handleDoubleClick = useCallback(
    (nodeId: string) => nodesManagerService.navToNode(nodeId),
    [nodesManagerService]
  );

  const handleExpand = useCallback(
    (id: string) => {
      if (!isExpanded) {
        navigationTreeService.loadNestedNodes(id).then(state => !state && switchExpand(false));
      }
      switchExpand(!isExpanded);
    },
    [isExpanded]
  );

  const handleSelect = useCallback(
    (id: string, isMultiple?: boolean) => {
      switchSelect(navigationTreeService.selectNode(id, isMultiple));
    },
    [isSelected]
  );

  const {
    name, nodeType, icon, hasChildren,
  } = node;

  useEffect(() => {
    if (!isExpandable || !hasChildren) {
      switchExpand(false);
    }
  }, [isExpandable && hasChildren]);

  // Here we subscribe to selected nodes if current node selected (mobx)
  if (isSelected && !navigationTreeService.selectedNodes.includes(node.id)) {
    switchSelect(false);
  }

  return {
    name,
    nodeType,
    icon,
    isExpanded,
    isLoaded,
    isExpandable,
    isSelected,
    hasChildren,
    handleDoubleClick,
    handleSelect,
    handleExpand,
  };
}

export function isExpandableFilter(node: NodeWithParent) {
  return !node.object?.features?.find(feature => feature === EObjectFeature.entity);
}
