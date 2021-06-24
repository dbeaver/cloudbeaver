/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { useCallback, useMemo, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo, SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';

import type { IExecutionPlanNode, IExecutionPlanTreeContext } from './ExecutionPlanTreeContext';

interface IState {
  selectedNode: IExecutionPlanNode | null;
  metadataPanel: boolean;
}

export function isVisibleProperty(property: ObjectPropertyInfo): boolean {
  return property.features.includes('viewable');
}

export function useExecutionPlanTreeState(list: SqlExecutionPlanNode[], query: string): IExecutionPlanTreeContext {
  const props = useObjectRef({ list, query });
  const [state] = useState(() => observable<IState>({
    selectedNode: null,
    metadataPanel: false,
  }));

  const selectNode = useCallback((node: IExecutionPlanNode) => {
    if (!state.metadataPanel) {
      state.metadataPanel = true;
    }
    state.selectedNode = node;
  }, [state]);

  const columns = useMemo(() => computed(() => {
    const result: ObjectPropertyInfo[] = [];

    for (const node of props.list) {
      for (const property of node.properties) {
        if (property.id && isVisibleProperty(property) && !result.find(column => column.id === property.id)) {
          result.push(property);
        }
      }
    }

    return result;
  }), [props.list]).get();

  const nodes = useMemo(() => computed(() => {
    const map: Map<string, number> = new Map();

    const tree: IExecutionPlanNode[] = props.list
      .map((node, idx) => {
        map.set(node.id, idx);
        return ({ ...node, children: [] });
      });

    const result: IExecutionPlanNode[] = [];

    for (const node of tree) {
      if (node.parentId) {
        const parent = map.get(node.parentId)!;
        tree[parent].children.push(node);
      } else {
        result.push(node);
      }
    }

    return result;
  }), [props.list]).get();

  return useObjectRef({
    columns,
    nodes,
    metadataPanel: state.metadataPanel,
    selectedNode: state.selectedNode,
    query: props.query,
    selectNode,
  });
}
