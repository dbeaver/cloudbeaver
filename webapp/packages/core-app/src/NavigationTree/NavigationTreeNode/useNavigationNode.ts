/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useEffect, useState } from 'react';

import { useConnectionInfo } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

import { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { NodeManagerUtils } from '../../shared/NodesManager/NodeManagerUtils';
import { useNode } from '../../shared/NodesManager/useNode';
import { useChildren } from '../../shared/useChildren';
import { NavigationTreeService } from '../NavigationTreeService';
import { TreeContext } from '../TreeContext';

interface INavigationNode {
  control?: React.FC<{
    node: NavNode;
  }>;
  selected: boolean;
  loading: boolean;
  expanded: boolean;
  leaf: boolean;
  handleExpand: () => void;
  handleOpen: () => void;
  handleSelect: (isMultiple?: boolean) => void;
}

export function useNavigationNode(node: NavNode): INavigationNode {
  const context = useContext(TreeContext);
  const navigationTreeService = useService(NavigationTreeService);
  const [processing, setProcessing] = useState(false);
  const [isExpanded, switchExpand] = useState(false);
  const { isLoading, isOutdated } = useNode(node.id);
  const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(node.id);
  const { connectionInfo } = useConnectionInfo(connectionId);
  const children = useChildren(node.id);
  const loading = isLoading() || children.isLoading() || processing;

  let leaf = isLeaf(node) || children.children?.length === 0;
  let expanded = isExpanded && !leaf;

  if (node.objectFeatures.includes(EObjectFeature.dataSource) && !connectionInfo?.connected) {
    leaf = false;
    expanded = false;
  }

  const handleExpand = async () => {
    if (!expanded) {
      const timeout = setTimeout(() => setProcessing(true), 1);
      const state = await navigationTreeService.loadNestedNodes(node.id);
      clearTimeout(timeout);
      setProcessing(false);
      if (!state) {
        switchExpand(false);
        return;
      }
    }
    switchExpand(!expanded);
  };

  const handleOpen = async () => {
    setProcessing(true);
    try {
      await context?.onOpen?.(node);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelect = (multiple = false) => context?.onSelect?.(node, multiple);

  // TODO: probably should be refactored
  useEffect(() => {
    if (expanded && children.isOutdated() && !children.isLoading() && children.isLoaded() && !isOutdated()) {
      setProcessing(true);
      navigationTreeService
        .loadNestedNodes(node.id)
        .then(state => {
          setProcessing(false);
          if (!state) {
            switchExpand(false);
          }
        });
    }
  }, [expanded, children.isOutdated(), children.isLoading(), children.isLoaded(), isOutdated(), node]);

  useEffect(() => () => {
    if (node && context?.isSelected?.(node)) {
      context.onSelect?.(node, true);
    }
  }, [context, node]);

  return {
    control: context?.control,
    selected: context?.isSelected?.(node) || false,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleOpen,
    handleSelect,
  };
}

export function isLeaf(node: NavNode): boolean {
  return !node.hasChildren || node.objectFeatures.includes(EObjectFeature.entity);
}
