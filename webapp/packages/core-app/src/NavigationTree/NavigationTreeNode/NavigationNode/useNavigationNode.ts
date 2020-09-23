/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState, useCallback, useEffect } from 'react';

import { useConnectionInfo } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

import { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { useChildren } from '../../../shared/useChildren';
import { NavigationTreeService } from '../../NavigationTreeService';

export function useNavigationNode(node: NavNode, nodeLoading: boolean, nodeLoaded: boolean, nodeOutdated: boolean) {
  const navigationTreeService = useService(NavigationTreeService);
  const [isExpanded, switchExpand] = useState(false);
  const [isSelected, switchSelect] = useState(false);
  const [isExpanding, setExpanding] = useState(false);
  const children = useChildren(node.id);

  const isLoading = nodeLoading || children.isLoading || isExpanding;
  const isLoaded = children.isLoaded || nodeLoaded;
  let isExpandable = isExpandableFilter(node) && (
    !isLoaded || children.isOutdated || !children.children || children.children.length > 0
  );
  let isExpandedActually = isExpanded && (children.children?.length || 0) > 0;

  if (node.objectFeatures.includes(EObjectFeature.dataSource)) {
    const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(node.id);
    const { connectionInfo } = useConnectionInfo(connectionId);

    if (!connectionInfo?.connected) {
      isExpandable = true;
      isExpandedActually = false;
    }
  }

  const handleDoubleClick = useCallback(
    () => navigationTreeService.navToNode(node.id, node.parentId),
    [navigationTreeService, node]
  );

  const handleExpand = useCallback(
    async () => {
      if (!isExpandedActually) {
        setExpanding(true);
        const state = await navigationTreeService.loadNestedNodes(node.id);
        setExpanding(false);
        if (!state) {
          switchExpand(false);
          return;
        }
      }
      switchExpand(!isExpandedActually);
    },
    [isExpandedActually, node]
  );

  const handleSelect = useCallback(
    (isMultiple?: boolean) => {
      switchSelect(navigationTreeService.selectNode(node.id, isMultiple));
    },
    [isSelected, node]
  );

  useEffect(() => {
    if (!isExpandable || !node.hasChildren) {
      switchExpand(false);
    }
  }, [isExpandable, node.hasChildren]);

  useEffect(() => {
    if (isExpandedActually && children.isOutdated && !children.isLoading && children.isLoaded && !nodeOutdated) {
      setExpanding(true);
      navigationTreeService
        .loadNestedNodes(node.id)
        .then((state) => {
          setExpanding(false);
          if (!state) {
            switchExpand(false);
          }
        });
    }
  }, [isExpandedActually, children.isOutdated, children.isLoading, children.isLoaded, nodeOutdated, node]);

  // Here we subscribe to selected nodes if current node selected (mobx)
  if (isSelected && !navigationTreeService.isNodeSelected(node.id)) {
    switchSelect(false);
  }

  useEffect(() => () => {
    if (navigationTreeService.isNodeSelected(node.id)) {
      navigationTreeService.selectNode(node.id, true);
    }
  }, [navigationTreeService, node]);

  return {
    isExpanded: isExpandedActually,
    isLoaded,
    isLoading,
    isExpandable,
    isSelected,
    handleDoubleClick,
    handleSelect,
    handleExpand,
  };
}

export function isExpandableFilter(node: NavNode) {
  return node.hasChildren && !node.objectFeatures.includes(EObjectFeature.entity);
}
