/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { INode } from '../INode.js';
import type { INodeState } from '../INodeState.js';
import type { TreeDataTransformer } from './TreeDataTransformer.js';

export function rootNodeStateTransformer(root: string): TreeDataTransformer<INodeState> {
  return function rootNodeStateTransformer(treeData, nodeId, data) {
    if (nodeId === root) {
      return {
        ...data,
        expanded: true,
      };
    }

    return data;
  };
}

export function rootNodeTransformer(root: string): TreeDataTransformer<INode> {
  return function rootNodeTransformer(treeData, nodeId, data) {
    if (nodeId === root) {
      return {
        ...data,
        leaf: false,
      };
    }

    return data;
  };
}
