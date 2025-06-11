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
}

export interface ITreeSelection {
  multipleSelection: boolean;
  selectedNodes: string[];
  isNodeSelected(nodeId: string): boolean;
  isNodeIndeterminateSelected(nodeId: string): boolean;
  selectNode(treeData: ITreeData, nodeId: string, selected?: boolean): Promise<void>;
  selectAll(treeData: ITreeData): Promise<void>;
  clearSelection(treeData: ITreeData): void;
  getSelectedNodes(): string[];
}

function getAllNodes(treeData: ITreeData, nodeId: string): string[] {
  const nodes = [nodeId];
  const children = treeData.getChildren(nodeId);

  children.forEach(childId => {
    nodes.push(...getAllNodes(treeData, childId));
  });

  return nodes;
}

function updateIndeterminateState(treeData: ITreeData, nodeId: string): void {
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

function updateIndeterminateStateRecursively(treeData: ITreeData, nodeId: string): void {
  updateIndeterminateState(treeData, nodeId);

  const parent = treeData.getParent(nodeId);
  if (parent) {
    updateIndeterminateStateRecursively(treeData, parent);
  }
}

async function getAllNodesWithLoad(treeData: ITreeData, nodeId: string): Promise<string[]> {
  const nodes = [nodeId];
  const nodeState = treeData.getState(nodeId);

  if (!nodeState.expanded) {
    try {
      treeData.updateState(nodeId, { expanded: true });
      await treeData.load(nodeId, true);

      const children = treeData.getChildren(nodeId);

      if (children.length === 0) {
        treeData.updateState(nodeId, { expanded: false });
        return nodes;
      }
    } catch (error) {
      treeData.updateState(nodeId, { expanded: false });
      return nodes;
    }
  }

  const children = treeData.getChildren(nodeId);

  if (children.length > 0) {
    const childPromises = children.map(childId => getAllNodesWithLoad(treeData, childId));
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
        const allNodes = getAllNodes(treeData, treeData.rootId);
        return allNodes.filter(nodeId => treeData.getState(nodeId).selected);
      },
      isNodeSelected(nodeId: string): boolean {
        const nodeState = treeData.getState(nodeId);

        if (nodeState.selected) {
          return true;
        }

        const node = treeData.getNode(nodeId);

        if (!node.leaf) {
          const children = treeData.getChildren(nodeId);

          if (children.length > 0) {
            return children.every(child => this.isNodeSelected(child));
          }
        }

        return false;
      },
      isNodeIndeterminateSelected(nodeId: string): boolean {
        if (this.isNodeSelected(nodeId)) {
          return false;
        }

        const node = treeData.getNode(nodeId);

        if (node.leaf) {
          return false;
        }

        const children = treeData.getChildren(nodeId);

        if (children.length > 0) {
          return children.some(child => this.isNodeSelected(child) || this.isNodeIndeterminateSelected(child));
        }

        return false;
      },
      async selectNode(treeData: ITreeData, nodeId: string, selected?: boolean): Promise<void> {
        const nodeState = treeData.getState(nodeId);
        if (nodeState.loading) {
          return;
        }

        const currentlySelected = nodeState.selected;
        const shouldSelect = selected !== undefined ? selected : !currentlySelected;

        if (!this.multipleSelection && shouldSelect) {
          this.clearSelection(treeData);
        }

        const node = treeData.getNode(nodeId);

        if (node.leaf) {
          treeData.updateState(nodeId, { selected: shouldSelect });
        } else {
          const allNodes = await getAllNodesWithLoad(treeData, nodeId);
          allNodes.forEach(childId => {
            treeData.updateState(childId, { selected: shouldSelect });
          });
        }

        const parent = treeData.getParent(nodeId);
        if (parent) {
          updateIndeterminateStateRecursively(treeData, parent);
        }

        options.onSelectionChange?.(this.getSelectedNodes());
      },
      async selectAll(treeData: ITreeData): Promise<void> {
        if (!this.multipleSelection) {
          return;
        }

        const rootState = treeData.getState(treeData.rootId);
        if (rootState.loading) {
          return;
        }

        await getAllNodesWithLoad(treeData, treeData.rootId);

        treeData.updateAllState({ selected: true, indeterminateSelected: false });

        options.onSelectionChange?.(this.getSelectedNodes());
      },
      clearSelection(treeData: ITreeData): void {
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
