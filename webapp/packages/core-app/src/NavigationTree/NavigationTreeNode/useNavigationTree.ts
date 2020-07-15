/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useCallback, useEffect } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { useConnectionInfo } from '../../shared/ConnectionsManager/useConnectionInfo';
import { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../shared/NodesManager/NodeManagerUtils';
import { useNode } from '../../shared/NodesManager/useNode';
import { useChildren } from '../../shared/useChildren';
import { NavigationTreeService } from '../NavigationTreeService';

export function useNavigationTree(nodeId: string, parentId: string) {
  const navigationTreeService = useService(NavigationTreeService);
  const [isExpanded, switchExpand] = useState(false);
  const [isSelected, switchSelect] = useState(false);
  const [isExpanding, setExpanding] = useState(false);
  const node = useNode(nodeId);
  const children = useChildren(nodeId);

  if (!node.node) {
    return undefined;
  }

  const isLoading = node.isLoading || children.isLoading || isExpanding;
  const isLoaded = children.isLoaded || node.isLoaded;
  let isExpandable = isExpandableFilter(node.node) && (
    !isLoaded || children.isOutdated || !children.children || children.children.length > 0
  );
  let isExpandedActually = isExpanded && (children.children?.length || 0) > 0;

  if (node.node.objectFeatures.includes(EObjectFeature.dataSource)) {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(nodeId);
    const { connectionInfo } = useConnectionInfo(connectionId);

    if (!connectionInfo?.connected) {
      isExpandable = true;
      isExpandedActually = false;
    }
  }

  const handleDoubleClick = useCallback(
    () => navigationTreeService.navToNode(nodeId, parentId),
    [navigationTreeService, nodeId, parentId]
  );

  const handleExpand = useCallback(
    async () => {
      if (!isExpandedActually) {
        setExpanding(true);
        const state = await navigationTreeService.loadNestedNodes(nodeId);
        setExpanding(false);
        if (!state) {
          switchExpand(false);
          return;
        }
      }
      switchExpand(!isExpandedActually);
    },
    [isExpandedActually, nodeId]
  );

  const handleSelect = useCallback(
    (isMultiple?: boolean) => {
      switchSelect(navigationTreeService.selectNode(nodeId, isMultiple));
    },
    [isSelected, nodeId]
  );

  const {
    name, nodeType, icon, hasChildren,
  } = node.node;

  useEffect(() => {
    if (!isExpandable || !hasChildren) {
      switchExpand(false);
    }
  }, [isExpandable, hasChildren]);

  useEffect(() => {
    if (isExpandedActually && children.isOutdated && !children.isLoading && children.isLoaded && !node.isOutdated) {
      setExpanding(true);
      navigationTreeService
        .loadNestedNodes(nodeId)
        .then((state) => {
          setExpanding(false);
          if (!state) {
            switchExpand(false);
          }
        });
    }
  }, [isExpandedActually, children.isOutdated, children.isLoading, children.isLoaded, node.isOutdated, nodeId]);

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
    node: node.node,
    nodeType,
    icon,
    isExpanded: isExpandedActually,
    isLoaded,
    isLoading,
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
