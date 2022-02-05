/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useEffect } from 'react';

import { getComputed, useObjectRef } from '@cloudbeaver/core-blocks';

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
  empty: boolean;
  handleExpand: () => Promise<void>;
  handleOpen: () => Promise<void>;
  handleClick: (leaf: boolean) => Promise<void>;
  handleSelect: (isMultiple?: boolean, nested?: boolean) => Promise<void>;
}

export function useNavigationNode(node: NavNode, path: string[]): INavigationNode {
  const contextRef = useObjectRef({
    context: useContext(TreeContext),
  });
  const { isLoading } = useNode(node.id);
  const children = useChildren(node.id);

  const loading = getComputed(() => isLoading() || children.isLoading());
  const isExpanded = getComputed(() => contextRef.context?.tree.isNodeExpanded(node.id) || false);
  const leaf = getComputed(() => isLeaf(node));
  const group = getComputed(() => contextRef.context?.tree.isGroup?.(node) || false);
  const empty = getComputed(() => children.children?.length === 0);
  const expanded = getComputed(() => isExpanded && !leaf && !empty);
  const control = getComputed(() => contextRef.context?.control);
  const disabled = getComputed(() => contextRef.context?.tree.disabled || false);
  const selected = getComputed(() => contextRef.context?.tree.isNodeSelected(node.id) || false);

  const handleClick = async (leaf: boolean) => await contextRef.context?.onClick?.(node, path, leaf);
  const handleOpen = async () => await contextRef.context?.onOpen?.(node, path);
  const handleExpand = async () => await contextRef.context?.tree.expand(node, !expanded);
  const handleSelect = async (
    multiple = false,
    nested = false
  ) => await contextRef.context?.tree.select(node, multiple, nested);

  useEffect(() => () => {
    if (!contextRef.context?.selectionTree) {
      if (contextRef.context?.tree.isNodeSelected(node.id)) {
        contextRef.context.tree.select(node, true, false);
      }
    }
  }, [node]);

  return {
    empty,
    group,
    control,
    disabled,
    selected,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleClick,
    handleOpen,
    handleSelect,
  };
}

export function isLeaf(node: NavNode): boolean {
  return !node.hasChildren || node.objectFeatures.includes(EObjectFeature.entity);
}
