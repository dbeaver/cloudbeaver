/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { IDataContext } from '@cloudbeaver/core-data-context';

import { NodeSizeCacheContext } from './contexts/NodeSizeCacheContext.js';
import { TreeContext } from './contexts/TreeContext.js';
import { TreeDataContext } from './contexts/TreeDataContext.js';
import { TreeDnDContext } from './contexts/TreeDnDContext.js';
import { TreeVirtualizationContext } from './contexts/TreeVirtualizationContext.js';
import type { INodeRenderer } from './INodeRenderer.js';
import { NodeChildren } from './NodeChildren.js';
import { useNodeSizeCache } from './useNodeSizeCache.js';
import { useTree } from './useTree.js';
import type { ITreeData } from './useTreeData.js';
import { useTreeDnD } from './useTreeDnD.js';
import { useTreeVirtualization } from './useTreeVirtualization.js';

export interface NavigationTreeNewProps {
  data: ITreeData;
  nodeRenderers?: INodeRenderer[];
  onNodeClick?(id: string): void | Promise<void>;
  onNodeDoubleClick?(id: string): void | Promise<void>;
  getNodeDnDContext?(id: string, context: IDataContext): void;
  getNodeHeight(id: string): number;
}

export const Tree = observer<NavigationTreeNewProps>(function Tree({
  data,
  nodeRenderers,
  onNodeClick,
  onNodeDoubleClick,
  getNodeDnDContext,
  getNodeHeight,
}) {
  const tree = useTree({
    data,
    nodeRenderers,
    onNodeClick,
    onNodeDoubleClick,
    getNodeHeight,
  });
  const mountOptimization = useTreeVirtualization();
  const elementsSizeCache = useNodeSizeCache(tree, data);
  const treeDnD = useTreeDnD({
    getContext: getNodeDnDContext,
  });

  return (
    <div ref={mountOptimization.setRootRef} style={{ overflow: 'auto', position: 'relative' }}>
      <NodeSizeCacheContext.Provider value={elementsSizeCache}>
        <TreeDataContext.Provider value={data}>
          <TreeVirtualizationContext.Provider value={mountOptimization}>
            <TreeContext.Provider value={tree}>
              <TreeDnDContext.Provider value={treeDnD}>
                <NodeChildren nodeId={data.rootId} offsetHeight={0} root />
              </TreeDnDContext.Provider>
            </TreeContext.Provider>
          </TreeVirtualizationContext.Provider>
        </TreeDataContext.Provider>
      </NodeSizeCacheContext.Provider>
    </div>
  );
});
