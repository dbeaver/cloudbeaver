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
import type { NavTreeControlComponent } from '../NavigationNodeComponent';
import { TreeContext } from '../TreeContext';

interface INavigationNode {
  control?: NavTreeControlComponent;
  disabled: boolean;
  group: boolean;
  selected: boolean;
  loading: boolean;
  expanded: boolean;
  leaf: boolean;
  handleExpand: () => Promise<void>;
  handleOpen: () => Promise<void>;
  handleClick: (leaf: boolean) => Promise<void>;
  handleSelect: (isMultiple?: boolean, nested?: boolean) => Promise<void>;
  handleFilter: (value: string) => Promise<void>;
  filterValue: string;
}

export function useNavigationNode(node: NavNode): INavigationNode {
  const contextRef = useObjectRef({
    context: useContext(TreeContext),
  });
  const { isLoading } = useNode(node.id);

  const children = useChildren(node.id);
  const loading = isLoading() || children.isLoading();

  const state = contextRef.context?.tree.getNodeState(node.id);
  const isExpanded = state?.expanded || false;

  let leaf = isLeaf(node);
  const group = contextRef.context?.tree.isGroup?.(node) || false;
  let expanded = isExpanded && !leaf;

  if (
    node.objectFeatures.includes(EObjectFeature.dataSource)
    && !node.objectFeatures.includes(EObjectFeature.dataSourceConnected)
  ) {
    leaf = false;
    expanded = false;
  }

  const handleClick = async (leaf: boolean) => await contextRef.context?.onClick?.(node, leaf);
  const handleOpen = async () => await contextRef.context?.onOpen?.(node);
  const handleExpand = async () => await contextRef.context?.tree.expand(node, !expanded);
  const handleSelect = async (
    multiple = false,
    nested = false
  ) => await contextRef.context?.tree.select(node, multiple, nested);
  const handleFilter = async (value: string) => await contextRef.context?.tree.filter(node, value);

  useEffect(() => () => {
    if (!contextRef.context?.selectionTree) {
      if (contextRef.context?.tree.isNodeSelected(node.id)) {
        contextRef.context?.tree.select(node, true, false);
      }
    }
  }, [node]);

  return {
    group,
    control: contextRef.context?.control,
    disabled: contextRef.context?.tree.disabled || false,
    selected: contextRef.context?.tree.isNodeSelected(node.id) || false,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleClick,
    handleOpen,
    handleSelect,
    handleFilter,
    filterValue: state?.filter || '',
  };
}

export function isLeaf(node: NavNode): boolean {
  return !node.hasChildren || node.objectFeatures.includes(EObjectFeature.entity);
}
