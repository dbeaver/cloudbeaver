/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo, SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';

import type { IExecutionPlanNode, IExecutionPlanTreeContext } from './ExecutionPlanTreeContext';

export function isVisibleProperty(property: ObjectPropertyInfo): boolean {
  return property.features.includes('viewable');
}

export function useExecutionPlanTreeState(
  nodeList: SqlExecutionPlanNode[], onNodeSelect: (nodeId: string) => void
): IExecutionPlanTreeContext {
  return useObservableRef(() => ({
    selectedNodes: new Map(),
    get columns() {
      const columns: ObjectPropertyInfo[] = [];

      for (const node of this.nodeList) {
        for (const property of node.properties) {
          if (property.id && isVisibleProperty(property) && !columns.find(column => column.id === property.id)) {
            columns.push(property);
          }
        }
      }

      return columns;
    },
    get nodes() {
      const map: Map<string, number> = new Map();

      const tree: IExecutionPlanNode[] = this.nodeList
        .map((node, idx) => {
          map.set(node.id, idx);
          return ({ ...node, children: [] });
        });

      const nodes: IExecutionPlanNode[] = [];

      for (const node of tree) {
        if (node.parentId) {
          const parent = map.get(node.parentId)!;
          tree[parent].children.push(node);
        } else {
          nodes.push(node);
        }
      }

      return nodes;
    },
    selectNode(nodeId: string) {
      this.selectedNodes.clear();
      this.selectedNodes.set(nodeId, true);
      this.onNodeSelect(nodeId);
    },
  }), {
    selectedNodes: observable,
    nodeList: observable.ref,
    columns: computed,
    nodes: computed,
  }, { nodeList, onNodeSelect }, ['selectNode']);
}
