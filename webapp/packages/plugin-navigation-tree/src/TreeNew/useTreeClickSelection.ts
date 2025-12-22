/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { useState } from 'react';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { ITreeData } from './ITreeData.js';
import type { ITreeClickSelection, INodeSelection } from './ITreeSelection.js';

export interface ITreeClickSelectionOptions {
  onSelectionChange?: (selectionState: MetadataMap<string, INodeSelection>) => void | Promise<void>;
}

function collectVisibleNodes(treeData: ITreeData, nodeId: string): string[] {
  const result: string[] = [];
  const stack: string[] = [nodeId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    result.push(current);

    const state = treeData.getState(current);
    if (state.expanded) {
      const children = treeData.getChildren(current);
      for (let i = children.length - 1; i >= 0; i--) {
        stack.push(children[i]!);
      }
    }
  }

  return result;
}

function getNodesInRange(treeData: ITreeData, fromNode: string, toNode: string): string[] {
  const allNodes = collectVisibleNodes(treeData, treeData.rootId);
  const fromIndex = allNodes.indexOf(fromNode);
  const toIndex = allNodes.indexOf(toNode);

  if (fromIndex === -1 || toIndex === -1) {
    return [toNode];
  }

  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);

  return allNodes.slice(start, end + 1);
}

function getSelectionState(state: boolean): INodeSelection {
  return { selected: state, indeterminate: false };
}

export function useTreeClickSelection(treeData: ITreeData, options: ITreeClickSelectionOptions = {}): Readonly<ITreeClickSelection> {
  const optionsRef = useObjectRef(options);

  const [selectionState] = useState(() => new MetadataMap<string, INodeSelection>(() => ({ selected: false, indeterminate: false })));

  const treeClickSelection = useObservableRef(
    () => ({
      type: 'click' as const,
      selectionState,
      lastSelectedNode: null as string | null,
      isSelected(nodeId: string): boolean {
        return selectionState.get(nodeId)?.selected ?? false;
      },
      getSelection(nodeId: string): INodeSelection {
        return selectionState.get(nodeId) ?? getSelectionState(false);
      },
      async select(nodeId: string, multiple = false, range = false): Promise<void> {
        if (range && this.lastSelectedNode) {
          const nodesInRange = getNodesInRange(treeData, this.lastSelectedNode, nodeId);
          for (const id of nodesInRange) {
            selectionState.set(id, getSelectionState(true));
          }
        } else if (multiple) {
          const currentState = this.getSelection(nodeId);
          selectionState.set(nodeId, getSelectionState(!currentState.selected));
        } else {
          selectionState.clear();
          selectionState.set(nodeId, getSelectionState(true));
        }

        this.lastSelectedNode = nodeId;
        await optionsRef.onSelectionChange?.(selectionState);
      },
      async clear(): Promise<void> {
        selectionState.clear();
        await optionsRef.onSelectionChange?.(selectionState);
      },
      async selectAll(): Promise<void> {
        const allNodes = collectVisibleNodes(treeData, treeData.rootId);
        for (const id of allNodes) {
          selectionState.set(id, { selected: true, indeterminate: false });
        }
        await optionsRef.onSelectionChange?.(selectionState);
      },
    }),
    {
      lastSelectedNode: observable.ref,
      select: action.bound,
      clear: action.bound,
      selectAll: action.bound,
    },
    false,
    ['isSelected', 'getSelection'],
  );

  return treeClickSelection;
}
