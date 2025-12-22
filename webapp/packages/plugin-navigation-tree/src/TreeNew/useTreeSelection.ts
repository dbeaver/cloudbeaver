/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';
import { useState } from 'react';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { ITreeData } from './ITreeData.js';
import type { INodeSelection, ITreeCheckboxSelection } from './ITreeSelection.js';

export interface ITreeSelectionOptions {
  onSelectionChange?: (selectionState: MetadataMap<string, INodeSelection>) => Promise<void> | void;
  multipleSelection?: boolean;
  expandOnSelect?: boolean;
}

type TreeSelectionState = MetadataMap<string, INodeSelection>;

function getDefaultSelection(): INodeSelection {
  return { selected: false, indeterminate: false };
}

function updateIndeterminateStates(treeData: ITreeData, selectionMap: TreeSelectionState, nodeId: string): void {
  let currentNodeId: string | null | undefined = nodeId;

  while (currentNodeId) {
    updateNodeIndeterminateState(treeData, selectionMap, currentNodeId);
    currentNodeId = treeData.getParent(currentNodeId);
  }
}

function updateNodeIndeterminateState(treeData: ITreeData, selectionMap: TreeSelectionState, nodeId: string): void {
  const node = treeData.getNode(nodeId);
  const children = treeData.getUnfilteredChildren(nodeId);
  const currentState = selectionMap.get(nodeId) ?? getDefaultSelection();

  if (node.leaf || children.length === 0) {
    if (currentState.indeterminate) {
      selectionMap.set(nodeId, { selected: currentState.selected, indeterminate: false });
    }
    return;
  }

  let selectedCount = 0;
  let indeterminateCount = 0;

  for (const childId of children) {
    const childState = selectionMap.get(childId) ?? getDefaultSelection();
    if (childState.selected) {
      selectedCount++;
    }
    if (childState.indeterminate) {
      indeterminateCount++;
    }
  }

  const allSelected = selectedCount === children.length;
  const someSelected = selectedCount > 0 || indeterminateCount > 0;
  const newIndeterminate = !allSelected && someSelected;

  if (currentState.selected !== allSelected || currentState.indeterminate !== newIndeterminate) {
    selectionMap.set(nodeId, {
      selected: allSelected,
      indeterminate: newIndeterminate,
    });
  }
}

async function setSelectionWithLoad(
  treeData: ITreeData,
  selectionMap: TreeSelectionState,
  nodeId: string,
  shouldSelect: boolean,
  expandOnSelect: boolean = false,
): Promise<string[]> {
  const nodes = [nodeId];
  const nodeState = treeData.getState(nodeId);
  const currentSelectedState = selectionMap.get(nodeId) ?? getDefaultSelection();

  if (currentSelectedState.selected === shouldSelect && !currentSelectedState.indeterminate) {
    return nodes;
  }

  selectionMap.set(nodeId, { selected: shouldSelect, indeterminate: false });

  try {
    await treeData.load(nodeId, true);
    const children = treeData.getChildren(nodeId);

    if (children.length > 0) {
      const BATCH_SIZE = 10;

      for (let i = 0; i < children.length; i += BATCH_SIZE) {
        const batch = children.slice(i, i + BATCH_SIZE);

        const batchPromises = batch.map(childId =>
          setSelectionWithLoad(treeData, selectionMap, childId, shouldSelect, expandOnSelect).catch(() => []),
        );

        const batchResults = await Promise.all(batchPromises);

        batchResults.forEach(childNodes => {
          nodes.push(...childNodes);
        });
      }
    } else if (!treeData.getNode(nodeId).leaf) {
      selectionMap.set(nodeId, getDefaultSelection());
    }
  } catch {
    treeData.updateState(nodeId, { expanded: false });
    selectionMap.set(nodeId, getDefaultSelection());
    return nodes;
  }

  if (!nodeState.expanded && expandOnSelect) {
    treeData.updateState(nodeId, { expanded: true });
  }

  return nodes;
}

export function useTreeSelection(treeData: ITreeData, options: ITreeSelectionOptions = {}): Readonly<ITreeCheckboxSelection> {
  options = useObjectRef(options);

  const [selectionState] = useState(() => new MetadataMap<string, INodeSelection>(() => getDefaultSelection()));

  const treeSelection = useObservableRef(
    () => ({
      type: 'checkbox' as const,
      selectionState,
      isSelected(nodeId: string): boolean {
        return selectionState.get(nodeId)?.selected ?? false;
      },
      getSelection(nodeId: string): INodeSelection {
        return selectionState.get(nodeId) ?? getDefaultSelection();
      },
      async select(nodeId: string, selected?: boolean): Promise<void> {
        const currentState = this.getSelection(nodeId);
        const shouldSelect = selected ?? (currentState.indeterminate ? false : !currentState.selected);

        if (!options.multipleSelection && shouldSelect) {
          this.clear();
        }

        const node = treeData.getNode(nodeId);

        if (node.leaf) {
          selectionState.set(nodeId, { selected: shouldSelect, indeterminate: false });
        } else {
          await setSelectionWithLoad(treeData, selectionState, nodeId, shouldSelect, options.expandOnSelect);
        }

        updateIndeterminateStates(treeData, selectionState, nodeId);

        await options.onSelectionChange?.(selectionState);
      },
      async selectAll(): Promise<void> {
        if (!options.multipleSelection) {
          return;
        }

        await setSelectionWithLoad(treeData, selectionState, treeData.rootId, true, options.expandOnSelect);

        await options.onSelectionChange?.(selectionState);
      },
      async clear(): Promise<void> {
        selectionState.clear();

        await options.onSelectionChange?.(selectionState);
      },
    }),
    {
      select: action.bound,
      selectAll: action.bound,
      clear: action.bound,
    },
    false,
    ['getSelection', 'isSelected'],
  );

  return treeSelection;
}
