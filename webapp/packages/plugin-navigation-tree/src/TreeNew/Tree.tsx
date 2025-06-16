/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
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
import { TreeSelectionContext } from './contexts/TreeSelectionContext.js';
import { TreeVirtualizationContext } from './contexts/TreeVirtualizationContext.js';
import type { INodeRenderer } from './INodeRenderer.js';
import type { ITreeData } from './ITreeData.js';
import { NodeChildren } from './NodeChildren.js';
import type { NodeEmptyPlaceholderComponent } from './NodeEmptyPlaceholderComponent.js';
import { useNodeSizeCache } from './useNodeSizeCache.js';
import { useTree } from './useTree.js';
import { useTreeDnD } from './useTreeDnD.js';
import type { ITreeSelection } from './useTreeSelection.js';
import { useTreeVirtualization } from './useTreeVirtualization.js';

export interface NavigationTreeNewProps {
  data: ITreeData;
  selection?: ITreeSelection;
  nodeRenderers?: INodeRenderer[];
  emptyPlaceholder?: NodeEmptyPlaceholderComponent;
  className?: string;
  onNodeClick?(id: string): void | Promise<void>;
  onNodeDoubleClick?(id: string): void | Promise<void>;
  getNodeDnDContext?(id: string, context: IDataContext): void;
  getNodeHeight(id: string): number;
}

export const Tree = observer<NavigationTreeNewProps>(function Tree({
  data,
  selection,
  nodeRenderers,
  emptyPlaceholder,
  className,
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
    <div ref={mountOptimization.setRootRef} className={className} style={{ overflow: 'auto', position: 'relative' }}>
      <NodeSizeCacheContext.Provider value={elementsSizeCache}>
        <TreeDataContext.Provider value={data}>
          <TreeSelectionContext.Provider value={selection}>
            <TreeVirtualizationContext.Provider value={mountOptimization}>
              <TreeContext.Provider value={tree}>
                <TreeDnDContext.Provider value={treeDnD}>
                  <NodeChildren nodeId={data.rootId} offsetHeight={0} emptyPlaceholder={emptyPlaceholder} root />
                </TreeDnDContext.Provider>
              </TreeContext.Provider>
            </TreeVirtualizationContext.Provider>
          </TreeSelectionContext.Provider>
        </TreeDataContext.Provider>
      </NodeSizeCacheContext.Provider>
    </div>
  );
});
