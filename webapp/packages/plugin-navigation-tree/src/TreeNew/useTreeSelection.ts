/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, type IComputedValue } from 'mobx';
import { useState } from 'react';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { ITreeData } from './ITreeData.js';

export interface ITreeSelectionOptions {
  onSelectionChange?: (selectedNodeIds: Record<string, INodeSelection>) => void;
  multipleSelection?: boolean;
  expandOnSelect?: boolean;
}

export interface INodeSelection {
  selected: boolean;
  indeterminate: boolean;
}

export interface ITreeSelection {
  selectedNodes: Record<string, INodeSelection>;
  getNodeSelection(nodeId: string): INodeSelection;
  selectNode(nodeId: string): Promise<boolean>;
  selectAll(): Promise<void>;
  clearSelection(): void;
}

function getSelectionState(selectionMap: MetadataMap<string, INodeSelection>, nodeId: string): INodeSelection {
  return selectionMap.get(nodeId);
}

function setSelectionState(
  selectionMap: MetadataMap<string, INodeSelection>,
  nodeId: string,
  state: Partial<INodeSelection>
): void {
  const currentState = getSelectionState(selectionMap, nodeId);
  selectionMap.set(nodeId, { ...currentState, ...state });
}

function updateIndeterminateStates(treeData: ITreeData, selectionMap: MetadataMap<string, INodeSelection>, nodeId: string): void {
  updateNodeAndDescendantsIndeterminateState(treeData, selectionMap, nodeId);

  const parent = treeData.getParent(nodeId);
  if (parent) {
    updateAncestorsIndeterminateState(treeData, selectionMap, parent);
  }
}

function updateNodeAndDescendantsIndeterminateState(treeData: ITreeData, selectionMap: MetadataMap<string, INodeSelection>, nodeId: string): void {
  const children = treeData.getChildren(nodeId);

  children.forEach(childId => {
    updateNodeAndDescendantsIndeterminateState(treeData, selectionMap, childId);
  });

  updateNodeIndeterminateState(treeData, selectionMap, nodeId);
}

function updateAncestorsIndeterminateState(treeData: ITreeData, selectionMap: MetadataMap<string, INodeSelection>, nodeId: string): void {
  updateNodeIndeterminateState(treeData, selectionMap, nodeId);

  const parent = treeData.getParent(nodeId);
  if (parent) {
    updateAncestorsIndeterminateState(treeData, selectionMap, parent);
  }
}

function updateNodeIndeterminateState(treeData: ITreeData, selectionMap: MetadataMap<string, INodeSelection>, nodeId: string): void {
  const node = treeData.getNode(nodeId);
  const children = treeData.getChildren(nodeId);

  if (node.leaf || children.length === 0) {
    setSelectionState(selectionMap, nodeId, { indeterminate: false });
    return;
  }

  const selectedChildren = children.filter(childId => getSelectionState(selectionMap, childId).selected);
  const indeterminateChildren = children.filter(childId => getSelectionState(selectionMap, childId).indeterminate);

  const allSelected = selectedChildren.length === children.length;
  const someSelected = selectedChildren.length > 0 || indeterminateChildren.length > 0;

  setSelectionState(selectionMap, nodeId, {
    selected: allSelected,
    indeterminate: !allSelected && someSelected,
  });
}

async function updateAllDescendantNodesWithLoad(
  treeData: ITreeData,
  selectionMap: MetadataMap<string, INodeSelection>,
  nodeId: string,
  shouldSelect: boolean,
  expandOnSelect: boolean = false,
): Promise<string[]> {
  const nodes = [nodeId];
  const nodeState = treeData.getState(nodeId);
  const currentSelectedState = getSelectionState(selectionMap, nodeId);

  setSelectionState(selectionMap, nodeId, { selected: shouldSelect, indeterminate: false });

  if (!nodeState.expanded && (currentSelectedState.selected !== shouldSelect || currentSelectedState.indeterminate)) {
    try {
      if (expandOnSelect) {
        treeData.updateState(nodeId, { expanded: true });
      }
      await treeData.load(nodeId, true);

      const children = treeData.getChildren(nodeId);

      if (children.length === 0) {
        treeData.updateState(nodeId, { expanded: true });
        setSelectionState(selectionMap, nodeId, { selected: shouldSelect, indeterminate: false });
        return nodes;
      }
    } catch (error) {
      treeData.updateState(nodeId, { expanded: false });
      return nodes;
    }
  }

  const children = treeData.getChildren(nodeId);

  if (children.length > 0) {
    const childPromises = children.map(childId => updateAllDescendantNodesWithLoad(treeData, selectionMap, childId, shouldSelect, expandOnSelect));
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

  const [internalState] = useState(() => new MetadataMap<string, INodeSelection>(() => ({ selected: false, indeterminate: false })));

  const [selectionCache] = useState(
    () =>
      new MetadataMap<string, IComputedValue<INodeSelection>>(id =>
        computed(() => {
          const state = internalState.get(id);
          return { ...state };
        }),
      ),
  );

  const treeSelection = useObservableRef(
    () => ({
      get selectedNodes(): Record<string, INodeSelection> {
        const result: Record<string, INodeSelection> = {};

        for (const [nodeId, selection] of internalState) {
          if (selection.selected || selection.indeterminate) {
            result[nodeId] = { ...selection };
          }
        }

        return result;
      },
      getNodeSelection(nodeId: string): INodeSelection {
        return selectionCache.get(nodeId).get();
      },
      async selectNode(nodeId: string): Promise<boolean> {
        const currentState = selectionCache.get(nodeId).get();
        const shouldSelect = currentState.indeterminate ? false : !currentState.selected;

        if (!options.multipleSelection && shouldSelect) {
          this.clearSelection();
        }

        const node = treeData.getNode(nodeId);

        if (node.leaf) {
          internalState.set(nodeId, { selected: shouldSelect, indeterminate: false });
        } else {
          await updateAllDescendantNodesWithLoad(treeData, internalState, nodeId, shouldSelect, options.expandOnSelect);
        }

        updateIndeterminateStates(treeData, internalState, nodeId);

        options.onSelectionChange?.(this.selectedNodes);
        return shouldSelect;
      },
      async selectAll(): Promise<void> {
        if (!options.multipleSelection) {
          return;
        }

        await updateAllDescendantNodesWithLoad(treeData, internalState, treeData.rootId, true, options.expandOnSelect);

        options.onSelectionChange?.(this.selectedNodes);
      },
      clearSelection(): void {
        internalState.clear();

        options.onSelectionChange?.(this.selectedNodes);
      },
    }),
    {
      selectedNodes: computed,
    },
    false,
    ['selectNode', 'selectAll', 'clearSelection', 'getNodeSelection'],
  );

  return treeSelection;
}
