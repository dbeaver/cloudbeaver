/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { INode } from '../INode';
import type { INodeState } from '../INodeState';
import type { TreeDataTransformer } from './TreeDataTransformer';

export function rootNodeStateTransformer(root: string): TreeDataTransformer<INodeState> {
  return function rootNodeStateTransformer(nodeId, data) {
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
  return function rootNodeTransformer(nodeId, data) {
    if (nodeId === root) {
      return {
        ...data,
        leaf: false,
      };
    }

    return data;
  };
}
