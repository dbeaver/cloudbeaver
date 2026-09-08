/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useMergeRefs } from '@cloudbeaver/core-blocks';
import { clsx } from '@dbeaver/ui-kit';

import { TreeKeyboardNavigationContext } from '../TreeKeyboardNavigationContext.js';
import { useTreeKeyboardNavigation } from '../useTreeKeyboardNavigation.js';
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
import type { ITreeDnD } from './useTreeDnD.js';
import { useTreeVirtualization } from './useTreeVirtualization.js';
import { TreeMenuContextProvider } from './contexts/TreeMenuContext/TreeMenuContextProvider.js';
import type { ITreeMenu } from './useTreeMenu.js';

export interface NavigationTreeNewProps {
  data: ITreeData;
  selection?: ITreeSelection;
  menu?: ITreeMenu;
  dnd?: ITreeDnD;
  nodeRenderers?: INodeRenderer[];
  emptyPlaceholder?: NodeEmptyPlaceholderComponent;
  className?: string;
  onNodeClick?(id: string): void | Promise<void>;
  onNodeDoubleClick?(id: string): void | Promise<void>;
  onNodeActivate?(id: string): void | Promise<void>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  getNodeHeight(id: string): number;
}

export const Tree = observer<React.PropsWithChildren<NavigationTreeNewProps>>(function Tree({
  data,
  selection,
  menu,
  dnd,
  children,
  nodeRenderers,
  emptyPlaceholder,
  className,
  onNodeClick,
  onNodeDoubleClick,
  onNodeActivate,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  getNodeHeight,
}) {
  const tree = useTree({
    data,
    nodeRenderers,
    onNodeClick,
    onNodeDoubleClick,
    onNodeActivate,
    getNodeHeight,
  });
  const mountOptimization = useTreeVirtualization();
  const elementsSizeCache = useNodeSizeCache(tree, data);
  const treeKeyboardNavigation = useTreeKeyboardNavigation({
    rootId: data.rootId,
    getParent: nodeId => data.getParent(nodeId),
    getChildren: nodeId => data.getChildren(nodeId),
    isExpanded: nodeId => data.getState(nodeId).expanded,
    isLeaf: nodeId => !!data.getNode(nodeId).leaf,
    isSelected: nodeId => selection?.isSelected(nodeId) ?? data.getState(nodeId).selected,
    revealNode(nodeId) {
      mountOptimization.reveal(elementsSizeCache.getOffset(nodeId), tree.getNodeHeight(nodeId));
    },
  });
  const treeRootRef = useMergeRefs(mountOptimization.setRootRef, treeKeyboardNavigation.setRootRef);
  return (
    <NodeSizeCacheContext.Provider value={elementsSizeCache}>
      <TreeDataContext.Provider value={data}>
        <TreeSelectionContext.Provider value={selection}>
          <TreeContext.Provider value={tree}>
            <TreeKeyboardNavigationContext.Provider value={treeKeyboardNavigation}>
              <TreeDnDContext.Provider value={dnd ?? null}>
                <TreeMenuContextProvider menu={menu ?? null}>
                  {children}
                  <div
                    ref={treeRootRef}
                    role="tree"
                    aria-label={ariaLabel}
                    aria-labelledby={ariaLabelledBy}
                    tabIndex={treeKeyboardNavigation.activeNodeMounted ? -1 : 0}
                    className={clsx('tw:relative tw:overflow-auto', className)}
                    aria-multiselectable
                    onFocusCapture={treeKeyboardNavigation.onFocusCapture}
                    onKeyDown={treeKeyboardNavigation.onKeyDown}
                  >
                    <TreeVirtualizationContext.Provider value={mountOptimization}>
                      <NodeChildren nodeId={data.rootId} offsetHeight={0} emptyPlaceholder={emptyPlaceholder} root />
                    </TreeVirtualizationContext.Provider>
                  </div>
                </TreeMenuContextProvider>
              </TreeDnDContext.Provider>
            </TreeKeyboardNavigationContext.Provider>
          </TreeContext.Provider>
        </TreeSelectionContext.Provider>
      </TreeDataContext.Provider>
    </NodeSizeCacheContext.Provider>
  );
});
