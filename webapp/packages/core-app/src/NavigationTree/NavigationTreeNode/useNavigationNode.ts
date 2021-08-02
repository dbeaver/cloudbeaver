/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { useNode } from '../../shared/NodesManager/useNode';
import { useChildren } from '../../shared/useChildren';
import { TreeContext } from '../TreeContext';

interface INavigationNode {
  control?: React.FC<{
    node: NavNode;
  }>;
  selected: boolean;
  loading: boolean;
  expanded: boolean;
  leaf: boolean;
  handleExpand: () => Promise<void>;
  handleOpen: () => Promise<void>;
  handleSelect: (isMultiple?: boolean, nested?: boolean) => Promise<void>;
  handleFilter: (value: string) => Promise<void>;
  filterValue: string;
}

export function useNavigationNode({ id }: NavNode): INavigationNode {
  const contextRef = useObjectRef({
    context: useContext(TreeContext),
  });
  const { node, isLoading } = useNode(id);

  // TODO: hack to provide actual node information
  if (!node) {
    throw new Error('Node should exists');
  }

  const children = useChildren(node.id);
  const loading = isLoading() || children.isLoading();

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

  const handleOpen = async () => contextRef.context?.onOpen?.(node);
  const handleExpand = async () => contextRef.context?.tree.expand(node, !expanded);
  const handleSelect = async (
    multiple = false,
    nested = false
  ) => contextRef.context?.tree.select(node, multiple, nested);
  const handleFilter = async (value: string) => contextRef.context?.tree.filter(node, value);

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
