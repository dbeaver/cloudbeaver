/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useEffect, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
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
  handleSelect: (isMultiple?: boolean, nested?: boolean) => void;
  handleFilter: (value: string) => void;
  filterValue: string;
}

export function useNavigationNode(node: NavNode): INavigationNode {
  const contextRef = useObjectRef({
    context: useContext(TreeContext),
  });
  const navigationTreeService = useService(NavigationTreeService);
  const [processing, setProcessing] = useState(false);
  const { isLoading } = useNode(node.id);
  const children = useChildren(node.id);
  const loading = isLoading() || children.isLoading() || processing;

  const state = contextRef.context?.tree.getNodeState(node.id);
  const isExpanded = state?.expanded || false;
  let leaf = isLeaf(node);
  let expanded = isExpanded && !leaf;

  if (
    node.objectFeatures.includes(EObjectFeature.dataSource)
    && !node.objectFeatures.includes(EObjectFeature.dataSourceConnected)
  ) {
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
        contextRef.context?.tree.expand(node, false);
        return;
      }
    }
    contextRef.context?.tree.expand(node, !expanded);
  };

  const handleOpen = async () => {
    setProcessing(true);
    try {
      await contextRef.context?.onOpen?.(node);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelect = (multiple = false, nested = false) => {
    contextRef.context?.tree.select(node, multiple, nested);
  };

  const handleFilter = (value: string) => {
    contextRef.context?.tree.filter(node, value);
  };

  useEffect(() => () => {
    if (!contextRef.context?.selectionTree) {
      const state = contextRef.context?.tree.getNodeState(node.id);

      if (state?.selected) {
        contextRef.context?.tree.select(node, true, false);
      }
    }
  }, [node.id]);

  return {
    control: contextRef.context?.control,
    selected: state?.selected || false,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleOpen,
    handleSelect,
    handleFilter,
    filterValue: state?.filter || '',
  };
}

export function isLeaf(node: NavNode): boolean {
  return !node.hasChildren || node.objectFeatures.includes(EObjectFeature.entity);
}
