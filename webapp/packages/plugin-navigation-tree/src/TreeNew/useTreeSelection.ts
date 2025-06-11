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
  selectNode(treeData: ITreeData, nodeId: string, selected?: boolean): void;
  selectAll(treeData: ITreeData): void;
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
        return treeData.getState(nodeId).selected;
      },
      selectNode(treeData: ITreeData, nodeId: string, selected?: boolean): void {
        const currentlySelected = treeData.getState(nodeId).selected;
        const shouldSelect = selected !== undefined ? selected : !currentlySelected;

        if (!this.multipleSelection && shouldSelect) {
          this.clearSelection(treeData);
        }

        if (treeData.getChildren(nodeId).length > 0) {
          const allNodes = getAllNodes(treeData, nodeId);
          allNodes.forEach(childId => {
            treeData.updateState(childId, { selected: shouldSelect });
          });
        }

        treeData.updateState(nodeId, { selected: shouldSelect });
        options.onSelectionChange?.(this.getSelectedNodes());
      },
      selectAll(treeData: ITreeData): void {
        if (!this.multipleSelection) {
          return;
        }

        treeData.updateAllState({ selected: true });

        options.onSelectionChange?.(this.getSelectedNodes());
      },
      clearSelection(treeData: ITreeData): void {
        this.selectedNodes.forEach(nodeId => {
          treeData.updateState(nodeId, { selected: false });
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
    ['selectNode', 'selectAll', 'clearSelection', 'isNodeSelected', 'getSelectedNodes'],
  );
}
