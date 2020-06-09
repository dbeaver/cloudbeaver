/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useCallback, useEffect } from 'react';

import { useService } from '@dbeaver/core/di';

import { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { NavNodeManagerService } from '../../shared/NodesManager/NavNodeManagerService';
import { useNode } from '../../shared/NodesManager/useNode';
import { useChildren } from '../../shared/useChildren';
import { NavigationTreeService } from '../NavigationTreeService';


export function useNavigationTree(nodeId: string, parentId: string) {
  const navigationTreeService = useService(NavigationTreeService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const [isExpanded, switchExpand] = useState(false);
  const [isSelected, switchSelect] = useState(false);
  const { node, isLoaded: nodeLoaded } = useNode(nodeId);
  const children = useChildren(nodeId);

  if (!node) {
    return undefined;
  }

  const isLoaded = children.isLoaded;
  const isExpandable = isExpandableFilter(node) && (!isLoaded || children.children!.length > 0);

  const handleDoubleClick = useCallback(
    () => navNodeManagerService.navToNode(nodeId, parentId),
    [navNodeManagerService, nodeId, parentId]
  );

  const handleExpand = useCallback(
    async () => {
      if (!isExpanded) {
        const state = await navigationTreeService.loadNestedNodes(nodeId);
        if (!state) {
          switchExpand(false);
        }
      }
      switchExpand(!isExpanded);
    },
    [isExpanded, nodeId]
  );

  const handleSelect = useCallback(
    (isMultiple?: boolean) => {
      switchSelect(navigationTreeService.selectNode(nodeId, isMultiple));
    },
    [isSelected, nodeId]
  );

  const {
    name, nodeType, icon, hasChildren,
  } = node;

  useEffect(() => {
    if (!isExpandable || !hasChildren) {
      switchExpand(false);
    }
  }, [isExpandable && hasChildren]);

  useEffect(() => {
    if (isExpanded && !children.isLoaded && !children.isLoading && !!children.children && nodeLoaded) {
      navigationTreeService.loadNestedNodes(nodeId);
    }
  }, [isExpanded, children.isLoaded, children.isLoading, children.children, nodeLoaded, nodeId]);

  // Here we subscribe to selected nodes if current node selected (mobx)
  if (isSelected && !navigationTreeService.isNodeSelected(nodeId)) {
    switchSelect(false);
  }

  useEffect(() => () => {
    if (navigationTreeService.isNodeSelected(nodeId)) {
      navigationTreeService.selectNode(nodeId, true);
    }
  }, [navigationTreeService]);

  return {
    name,
    node,
    nodeType,
    icon,
    isExpanded,
    isLoaded,
    isLoading: children.isLoading,
    isExpandable,
    isSelected,
    hasChildren,
    handleDoubleClick,
    handleSelect,
    handleExpand,
  };
}

export function isExpandableFilter(node: NavNode) {
  return node.hasChildren && !node.objectFeatures.includes(EObjectFeature.entity);
}
