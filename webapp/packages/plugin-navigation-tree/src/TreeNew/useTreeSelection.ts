/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';

import type { ITreeData } from './ITreeData.js';

export interface ITreeSelectionOptions {
  onSelectionChange?: (selectedNodeIds: string[]) => void;
  multipleSelection?: boolean;
  expandOnSelect?: boolean;
}

export interface ITreeSelection {
  multipleSelection: boolean;
  selectedNodes: string[];
  isNodeSelected(nodeId: string): boolean;
  isNodeIndeterminateSelected(nodeId: string): boolean;
  selectNode(nodeId: string, selected?: boolean): Promise<void>;
  selectAll(): Promise<void>;
  clearSelection(): void;
  getSelectedNodes(): string[];
}

function getAllNodes(treeData: ITreeData, nodeId: string): string[] {
  const nodes: string[] = [];
  const stack: string[] = [nodeId];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();
    if (!currentNodeId) {
      continue;
    }

    nodes.push(currentNodeId);

    const children = treeData.getChildren(currentNodeId);
    for (let i = children.length - 1; i >= 0; i--) {
      const childId = children[i];
      if (childId) {
        stack.push(childId);
      }
    }
  }

  return nodes;
}

function updateIndeterminateStates(treeData: ITreeData, nodeId: string): void {
  updateNodeAndDescendantsIndeterminateState(treeData, nodeId);

  const parent = treeData.getParent(nodeId);
  if (parent) {
    updateAncestorsIndeterminateState(treeData, parent);
  }
}

function updateNodeAndDescendantsIndeterminateState(treeData: ITreeData, nodeId: string): void {
  const children = treeData.getChildren(nodeId);

  children.forEach(childId => {
    updateNodeAndDescendantsIndeterminateState(treeData, childId);
  });

  updateNodeIndeterminateState(treeData, nodeId);
}

function updateAncestorsIndeterminateState(treeData: ITreeData, nodeId: string): void {
  updateNodeIndeterminateState(treeData, nodeId);

  const parent = treeData.getParent(nodeId);
  if (parent) {
    updateAncestorsIndeterminateState(treeData, parent);
  }
}

function updateNodeIndeterminateState(treeData: ITreeData, nodeId: string): void {
  const node = treeData.getNode(nodeId);
  const children = treeData.getChildren(nodeId);

  if (node.leaf || children.length === 0) {
    treeData.updateState(nodeId, { indeterminateSelected: false });
    return;
  }

  const selectedChildren = children.filter(childId => treeData.getState(childId).selected);
  const indeterminateChildren = children.filter(childId => treeData.getState(childId).indeterminateSelected);

  const allSelected = selectedChildren.length === children.length;
  const someSelected = selectedChildren.length > 0 || indeterminateChildren.length > 0;

  treeData.updateState(nodeId, {
    selected: allSelected,
    indeterminateSelected: !allSelected && someSelected,
  });
}

async function updateAllDescendantNodesWithLoad(
  treeData: ITreeData,
  nodeId: string,
  shouldSelect: boolean,
  expandOnSelect: boolean = false,
): Promise<string[]> {
  const nodes = [nodeId];
  const nodeState = treeData.getState(nodeId);

  treeData.updateState(nodeId, { selected: shouldSelect, indeterminateSelected: false });

  if (!nodeState.expanded) {
    try {
      if (expandOnSelect) {
        treeData.updateState(nodeId, { expanded: true });
      }
      await treeData.load(nodeId, true);

      const children = treeData.getChildren(nodeId);

      if (children.length === 0) {
        treeData.updateState(nodeId, { expanded: true, selected: shouldSelect, indeterminateSelected: false });
        return nodes;
      }
    } catch (error) {
      treeData.updateState(nodeId, { expanded: false });
      return nodes;
    }
  }

  const children = treeData.getChildren(nodeId);

  if (children.length > 0) {
    const childPromises = children.map(childId => updateAllDescendantNodesWithLoad(treeData, childId, shouldSelect, expandOnSelect));
    const results = await Promise.allSettled(childPromises);

    results.forEach(result => {
      if (result.status === 'fulfilled') {
        nodes.push(...result.value);
      }
    });
  }

  return nodes;
}

export function useTreeSelection(treeData: ITreeData, options: ITreeSelectionOptions = {}): Readonly<ITreeSelection> {
  options = useObjectRef(options);

  return useObservableRef<ITreeSelection>(
    () => ({
      get multipleSelection(): boolean {
        return options.multipleSelection ?? false;
      },
      get selectedNodes(): string[] {
        const selectedNodes: string[] = [];

        const collectSelectedNodes = (nodeId: string): void => {
          const nodeState = treeData.getState(nodeId);
          if (nodeState.selected) {
            selectedNodes.push(nodeId);
          }

          const children = treeData.getChildren(nodeId);
          children.forEach(childId => collectSelectedNodes(childId));
        };

        collectSelectedNodes(treeData.rootId);
        return selectedNodes;
      },
      isNodeSelected(nodeId: string): boolean {
        return treeData.getState(nodeId).selected;
      },
      isNodeIndeterminateSelected(nodeId: string): boolean {
        return treeData.getState(nodeId).indeterminateSelected ?? false;
      },
      async selectNode(nodeId: string, selected?: boolean): Promise<void> {
        const nodeState = treeData.getState(nodeId);
        if (nodeState.loading) {
          return;
        }

        const currentlySelected = nodeState.selected;
        const shouldSelect = selected !== undefined ? selected : !currentlySelected;

        if (!this.multipleSelection && shouldSelect) {
          this.clearSelection();
        }

        const node = treeData.getNode(nodeId);

        if (node.leaf) {
          treeData.updateState(nodeId, { selected: shouldSelect, indeterminateSelected: false });
        } else {
          await updateAllDescendantNodesWithLoad(treeData, nodeId, shouldSelect, options.expandOnSelect);
        }

        updateIndeterminateStates(treeData, nodeId);

        options.onSelectionChange?.(this.getSelectedNodes());
      },
      async selectAll(): Promise<void> {
        if (!this.multipleSelection) {
          return;
        }

        const rootState = treeData.getState(treeData.rootId);
        if (rootState.loading) {
          return;
        }

        await updateAllDescendantNodesWithLoad(treeData, treeData.rootId, true, options.expandOnSelect);

        options.onSelectionChange?.(this.getSelectedNodes());
      },
      clearSelection(): void {
        const allNodes = getAllNodes(treeData, treeData.rootId);
        allNodes.forEach(nodeId => {
          treeData.updateState(nodeId, {
            selected: false,
            indeterminateSelected: false,
          });
        });

        options.onSelectionChange?.(this.getSelectedNodes());
      },
      getSelectedNodes(): string[] {
        return [...this.selectedNodes];
      },
    }),
    {
      multipleSelection: computed,
      selectedNodes: computed,
    },
    false,
    ['selectNode', 'selectAll', 'clearSelection', 'isNodeSelected', 'isNodeIndeterminateSelected', 'getSelectedNodes'],
  );
}
