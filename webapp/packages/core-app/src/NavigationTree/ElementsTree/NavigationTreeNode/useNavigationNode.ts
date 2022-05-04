/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import React, { useContext, useEffect, useRef } from 'react';

import { getComputed, useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import type { NavNode } from '../../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../../shared/NodesManager/EObjectFeature';
import { NavNodeInfoResource } from '../../../shared/NodesManager/NavNodeInfoResource';
import { useNode } from '../../../shared/NodesManager/useNode';
import { useChildren } from '../../../shared/useChildren';
import { ElementsTreeContext } from '../ElementsTreeContext';
import type { IElementsTreeAction } from '../IElementsTreeAction';
import type { NavTreeControlComponent } from '../NavigationNodeComponent';

interface INavigationNode {
  ref: React.RefObject<HTMLDivElement>;
  control?: NavTreeControlComponent;
  disabled: boolean;
  group: boolean;
  showInFilter: boolean;
  selected: boolean;
  indeterminateSelected: boolean;
  loading: boolean;
  expanded: boolean;
  leaf: boolean;
  empty: boolean;
  handleExpand: () => Promise<void>;
  handleOpen: (leaf: boolean) => Promise<void>;
  handleClick: (leaf: boolean) => Promise<void>;
  handleSelect: (isMultiple?: boolean, nested?: boolean) => Promise<void>;
  getSelected: () => NavNode[];
}

export function useNavigationNode(node: NavNode, path: string[]): INavigationNode {
  const elementRef = useRef<HTMLDivElement>(null);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const contextRef = useObjectRef({
    context: useContext(ElementsTreeContext),
  });
  const { isLoading } = useNode(node.id);
  const children = useChildren(node.id);

  const loading = getComputed(() => isLoading() || children.isLoading());
  const showInFilter = getComputed(() => contextRef.context?.tree.getNodeState(node.id).showInFilter || false);
  const isExpanded = getComputed(() => contextRef.context?.tree.isNodeExpanded(node.id) || false);
  const leaf = getComputed(() => isLeaf(node));
  const group = getComputed(() => contextRef.context?.tree.isGroup?.(node) || false);
  const empty = getComputed(() => children.children?.length === 0);
  const expanded = getComputed(() => isExpanded && !leaf && !empty);
  const control = getComputed(() => contextRef.context?.control);
  const disabled = getComputed(() => contextRef.context?.tree.disabled || false);
  const selected = getComputed(() => contextRef.context?.tree.isNodeSelected(node.id) || false);
  const getSelected = () => navNodeInfoResource
    .get(resourceKeyList(contextRef.context?.tree.getSelected() || []))
    .filter(Boolean) as NavNode[];
  const indeterminateSelected = getComputed(
    () => contextRef.context?.tree.isNodeIndeterminateSelected(node.id) || false
  );

  const handleClick = async (leaf: boolean) => await contextRef.context?.onClick?.(node, path, leaf);
  const handleOpen = async (leaf: boolean) => await contextRef.context?.onOpen?.(node, path, leaf);
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

  useEffect(() => {
    if (contextRef.context?.tree.isNodeSelected(node.id)) {
      elementRef.current?.scrollIntoView();
    }
  }, []);

  useExecutor({
    executor: contextRef.context?.tree.actions || new SyncExecutor<IElementsTreeAction>(),
    handlers: [function refreshRoot({ type, nodeId }) {
      if (type === 'show' && nodeId === node.id) {
        elementRef.current?.scrollIntoView();
      }
    }],
  });

  return {
    ref: elementRef,
    showInFilter,
    empty,
    group,
    control,
    disabled,
    selected,
    indeterminateSelected,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleClick,
    handleOpen,
    handleSelect,
    getSelected,
  };
}

export function isLeaf(node: NavNode): boolean {
  return !node.hasChildren || node.objectFeatures.includes(EObjectFeature.entity);
}
