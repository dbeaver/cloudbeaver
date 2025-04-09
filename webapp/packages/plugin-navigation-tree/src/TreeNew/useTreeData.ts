/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, type IComputedValue, observable } from 'mobx';
import { useEffect, useState } from 'react';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { applyTransforms } from './DataTransformers/applyTransforms.js';
import { rootNodeStateTransformer, rootNodeTransformer } from './DataTransformers/rootTransformers.js';
import type { TreeDataTransformer } from './DataTransformers/TreeDataTransformer.js';
import type { INode } from './INode.js';
import type { INodeState } from './INodeState.js';
import type { ITreeData } from './ITreeData.js';
import type { TreeState } from './TreeState.js';
import { useTreeState } from './useTreeState.js';

interface IOptions {
  rootId: string;
  externalState?: TreeState;
  getNode(id: string): INode;
  getChildren: (node: string) => string[];
  load(nodeId: string, manual: boolean): Promise<void>;

  getParent?: (node: string) => string | null;
  childrenTransformers?: TreeDataTransformer<string[]>[];
  nodeTransformers?: TreeDataTransformer<INode>[];
  parentTransformers?: TreeDataTransformer<string | null>[];
  stateTransformers?: TreeDataTransformer<INodeState>[];
}

const DEFAULT_PARENT_GETTER = () => null;

export function useTreeData(options: IOptions): ITreeData {
  options = useObservableRef(
    {
      ...options,
      getParent: options.getParent ?? DEFAULT_PARENT_GETTER,
      childrenTransformers: [...(options.childrenTransformers || [])],
      nodeTransformers: [...(options.nodeTransformers || [])],
      stateTransformers: [...(options.stateTransformers || [])],
      parentTransformers: [...(options.parentTransformers || [])],
    },
    {
      rootId: observable.ref,
      getNode: observable.ref,
      getChildren: observable.ref,
      getParent: observable.ref,
      load: observable.ref,

      childrenTransformers: observable.ref,
      nodeTransformers: observable.ref,
      parentTransformers: observable.ref,
      stateTransformers: observable.ref,
    },
  );
  const state = useTreeState(options.externalState);
  const [nodeCache] = useState(
    () =>
      new MetadataMap<string, IComputedValue<INode>>(id =>
        computed(() =>
          applyTransforms(treeData, id, options.getNode(id), [rootNodeTransformer(options.rootId), ...(options.nodeTransformers || [])]),
        ),
      ),
  );
  const [childrenCache] = useState(
    () =>
      new MetadataMap<string, IComputedValue<string[]>>(id =>
        computed(() => applyTransforms(treeData, id, options.getChildren(id), options.childrenTransformers)),
      ),
  );
  const [parentCache] = useState(
    () =>
      new MetadataMap<string, IComputedValue<string | null>>(id =>
        computed(() => applyTransforms(treeData, id, options.getParent?.(id) ?? null, options.parentTransformers)),
      ),
  );
  const [stateCache] = useState(
    () =>
      new MetadataMap<string, IComputedValue<INodeState>>(id =>
        computed(() =>
          applyTransforms(treeData, id, state.getState(id), [rootNodeStateTransformer(options.rootId), ...(options.stateTransformers || [])]),
        ),
      ),
  );

  const treeData = useObservableRef(
    () => ({
      getNode(id: string): INode {
        return nodeCache.get(id).get();
      },
      getChildren(nodeId: string): string[] {
        return childrenCache.get(nodeId).get();
      },
      getParent(id: string): string | null {
        return parentCache.get(id).get();
      },
      getState(id: string): Readonly<INodeState> {
        return stateCache.get(id).get();
      },
      updateState(id: string, state: Partial<INodeState>) {
        this.state.updateState(id, state);
      },
      updateAllState(state: Partial<INodeState>) {
        this.state.updateAllState(state);
      },
      async load(nodeId: string, manual: boolean) {
        await options.load(nodeId, manual);
      },
      async update() {
        const nodes = [this.rootId];

        while (nodes.length > 0) {
          const nodeId = nodes.shift()!;
          const state = this.state.getState(nodeId);

          if (!state.expanded) {
            continue;
          }

          await options.load(nodeId, false);

          const children = this.getChildren(nodeId);

          if (children.length === 0) {
            this.state.updateState(nodeId, { expanded: false });
            continue;
          }

          nodes.push(...children);
        }
      },
    }),
    { state: observable.ref, rootId: observable.ref },
    { state, rootId: options.rootId },
  );

  useEffect(() => {
    treeData.update();
  }, [options.rootId]);

  return treeData;
}
