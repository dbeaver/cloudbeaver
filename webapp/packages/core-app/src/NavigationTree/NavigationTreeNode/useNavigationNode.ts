/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useEffect, useState } from 'react';

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
  handleSelect: (isMultiple?: boolean) => void;
  handleFilter: (value: string) => void;
  filterValue: string;
}

export function useNavigationNode(node: NavNode): INavigationNode {
  const context = useContext(TreeContext);
  const navigationTreeService = useService(NavigationTreeService);
  const [processing, setProcessing] = useState(false);
  const { isLoading, isOutdated } = useNode(node.id);
  const children = useChildren(node.id);
  const loading = isLoading() || children.isLoading() || processing;

  const isExpanded = navigationTreeService.isNodeExpanded(node.id);
  let leaf = isLeaf(node) || (children.children?.length === 0 && !children.isOutdated());
  let expanded = isExpanded && !leaf;

  if (
    node.objectFeatures.includes(EObjectFeature.dataSource)
    && (
      !node.objectFeatures.includes(EObjectFeature.dataSourceConnected)
      || (!children.children && isOutdated())
    )
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
        navigationTreeService.expandNode(node.id, false);
        return;
      }
    }
    navigationTreeService.expandNode(node.id, !expanded);
  };

  const handleOpen = async () => {
    setProcessing(true);
    try {
      await context?.onOpen?.(node);
    } finally {
      setProcessing(false);
    }
  };

  const handleSelect = (multiple = false) => {
    context?.onSelect?.(node, multiple);
  };

  const handleFilter = (value: string) => {
    context?.onFilter?.(node, value);
  };

  // TODO: probably should be refactored
  useEffect(() => {
    if (expanded && children.isOutdated() && !children.isLoading() && children.isLoaded() && !isOutdated()) {
      setProcessing(true);
      navigationTreeService
        .loadNestedNodes(node.id)
        .then(state => {
          setProcessing(false);
          if (!state) {
            navigationTreeService.expandNode(node.id, false);
          }
        });
    }
  }, [expanded, children.isOutdated(), children.isLoading(), children.isLoaded(), isOutdated(), node]);

  useEffect(() => () => {
    if (!context?.selectionTree && node && context?.isSelected?.(node)) {
      context.onSelect?.(node, true);
    }
  }, [context, node.id]);

  useEffect(() => () => {
    // TODO: seems like selection & expand should be specific for separate tree definitions
    navigationTreeService.expandNode(node.id, false);

    context?.state?.delete(node.id);
  }, [node.id]);

  return {
    control: context?.control,
    selected: context?.isSelected?.(node) || false,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleOpen,
    handleSelect,
    handleFilter,
    filterValue: context?.state?.get(node.id).filter || '',
  };
}

export function isLeaf(node: NavNode): boolean {
  return !node.hasChildren || node.objectFeatures.includes(EObjectFeature.entity);
}
