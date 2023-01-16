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
import { type NavNode, NavNodeInfoResource, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-sdk';

import { useChildren } from '../../../NodesManager/useChildren';
import { useNode } from '../../../NodesManager/useNode';
import { ElementsTreeContext } from '../ElementsTreeContext';
import type { IElementsTreeAction } from '../IElementsTreeAction';
import type { NavTreeControlComponent } from '../NavigationNodeComponent';
import type { IElementsTree } from '../useElementsTree';


interface INavigationNode {
  ref: React.RefObject<HTMLDivElement>;
  control?: NavTreeControlComponent;
  disabled: boolean;
  group: boolean;
  showInFilter: boolean;
  selected: boolean;
  indeterminateSelected: boolean;
  loading: boolean;
  loaded: boolean;
  outdated: boolean;
  expanded: boolean;
  leaf: boolean;
  empty: boolean;
  expand: () => Promise<void>;
  open: (leaf: boolean) => Promise<void>;
  click: (leaf: boolean) => Promise<void>;
  select: (isMultiple?: boolean, nested?: boolean) => Promise<void>;
  getSelected: () => NavNode[];
}

export function useNavigationNode(node: NavNode, path: string[]): INavigationNode {
  const elementRef = useRef<HTMLDivElement>(null);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const contextRef = useObjectRef({
    context: useContext(ElementsTreeContext),
  });
  const { isLoading, isLoaded, isOutdated } = useNode(node.id);
  const children = useChildren(node.id);

  const outdated = getComputed(() => isOutdated() || children.isOutdated());
  const loading = getComputed(() => isLoading() || children.isLoading());
  const loaded = getComputed(() => children.children !== undefined && children.isLoaded() && isLoaded());
  const showInFilter = getComputed(() => contextRef.context?.tree.getNodeState(node.id).showInFilter || false);
  const isExpanded = getComputed(() => contextRef.context?.tree.isNodeExpanded(node.id) || false);
  const leaf = getComputed(() => isLeaf(node, children.children, contextRef.context?.tree));
  const group = getComputed(() => contextRef.context?.tree.isGroup?.(node) || false);
  const empty = getComputed(() => children.children?.length === 0);
  const expanded = getComputed(() => isExpanded);
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
    outdated,
    loaded,
    expanded,
    leaf,
    expand: handleExpand,
    click: handleClick,
    open: handleOpen,
    select: handleSelect,
    getSelected,
  };
}

export function isLeaf(node: NavNode, children: string[] | undefined, tree: IElementsTree | undefined): boolean {
  if (node.folder && tree?.settings?.foldersTree) {
    return false;
  }

  return (
    node.objectFeatures.includes(EObjectFeature.entity)
    || !node.hasChildren
    || children?.length === 0
  );
}
