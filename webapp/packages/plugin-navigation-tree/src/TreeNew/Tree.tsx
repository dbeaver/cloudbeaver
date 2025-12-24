/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { IDataContext } from '@cloudbeaver/core-data-context';
import { clsx } from '@dbeaver/ui-kit';

import { NodeSizeCacheContext } from './contexts/NodeSizeCacheContext.js';
import { TreeContext } from './contexts/TreeContext.js';
import { TreeDataContext } from './contexts/TreeDataContext.js';
import { TreeDnDContext } from './contexts/TreeDnDContext.js';
import { TreeSelectionContext } from './contexts/TreeSelectionContext.js';
import { TreeVirtualizationContext } from './contexts/TreeVirtualizationContext.js';
import type { INodeRenderer } from './INodeRenderer.js';
import type { ITreeData } from './ITreeData.js';
import type { ITreeSelection } from './ITreeSelection.js';
import { NodeChildren } from './NodeChildren.js';
import type { NodeEmptyPlaceholderComponent } from './NodeEmptyPlaceholderComponent.js';
import { useNodeSizeCache } from './useNodeSizeCache.js';
import { useTree } from './useTree.js';
import { useTreeDnD } from './useTreeDnD.js';
import { useTreeVirtualization } from './useTreeVirtualization.js';
import { TreeMenuContextProvider } from './contexts/TreeMenuContext/TreeMenuContextProvider.js';
import type { ITreeMenu } from './useTreeMenu.js';

export interface NavigationTreeNewProps {
  data: ITreeData;
  selection?: ITreeSelection;
  menu?: ITreeMenu;
  nodeRenderers?: INodeRenderer[];
  emptyPlaceholder?: NodeEmptyPlaceholderComponent;
  className?: string;
  onNodeClick?(id: string): void | Promise<void>;
  onNodeDoubleClick?(id: string): void | Promise<void>;
  getNodeDnDContext?(id: string, context: IDataContext): void;
  getNodeHeight(id: string): number;
}

export const Tree = observer<React.PropsWithChildren<NavigationTreeNewProps>>(function Tree({
  data,
  selection,
  menu,
  children,
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
    <NodeSizeCacheContext.Provider value={elementsSizeCache}>
      <TreeDataContext.Provider value={data}>
        <TreeSelectionContext.Provider value={selection}>
          <TreeContext.Provider value={tree}>
            <TreeDnDContext.Provider value={treeDnD}>
              <TreeMenuContextProvider menu={menu ?? null}>
                {children}
                <div ref={mountOptimization.setRootRef} className={clsx('tw:relative tw:overflow-auto', className)}>
                  <TreeVirtualizationContext.Provider value={mountOptimization}>
                    <NodeChildren nodeId={data.rootId} offsetHeight={0} emptyPlaceholder={emptyPlaceholder} root />
                  </TreeVirtualizationContext.Provider>
                </div>
              </TreeMenuContextProvider>
            </TreeDnDContext.Provider>
          </TreeContext.Provider>
        </TreeSelectionContext.Provider>
      </TreeDataContext.Provider>
    </NodeSizeCacheContext.Provider>
  );
});
