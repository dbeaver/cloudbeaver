/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useEffect } from 'react';

import { getComputed, TreeNode, useObjectRef, useStateDelay } from '@cloudbeaver/core-blocks';
import { clsx } from '@dbeaver/ui-kit';

import { TreeKeyboardNavigationContext } from '../TreeKeyboardNavigationContext.js';
import { TreeContext } from './contexts/TreeContext.js';
import { TreeDataContext } from './contexts/TreeDataContext.js';
import { TreeSelectionContext } from './contexts/TreeSelectionContext.js';
import type { NodeComponent } from './INodeRenderer.js';
import { NodeControl } from './NodeControl.js';
import { useNodeDnD } from './useNodeDnD.js';
import './Node.css';

export const Node: NodeComponent = observer(function Node({ nodeId, offsetHeight, controlRenderer, childrenRenderer }) {
  const tree = useContext(TreeContext)!;
  const data = useContext(TreeDataContext)!;
  const selection = useContext(TreeSelectionContext);
  const keyboardNavigation = useContext(TreeKeyboardNavigationContext)!;

  const { expanded, selected: stateSelected } = data.getState(nodeId);
  const selected = selection ? selection.isSelected(nodeId) : stateSelected;

  const dnd = useNodeDnD(nodeId);

  const isNodeLeaf = getComputed(() => data.getNode(nodeId).leaf);
  const isValidDropTarget = getComputed(() => dnd.state.isOverCurrent && dnd.state.canDrop);
  const shouldAutoExpand = useStateDelay(isValidDropTarget, 600);

  useEffect(() => {
    if (shouldAutoExpand && !expanded && !isNodeLeaf) {
      tree.expandNode(nodeId, true);
    }
  }, [shouldAutoExpand, expanded, isNodeLeaf, nodeId, tree]);

  function handleOpen() {
    return tree.openNode(nodeId);
  }

  function handleToggleExpand() {
    return tree.expandNode(nodeId, !expanded);
  }

  function handleSelect(multiple?: boolean, nested?: boolean) {
    switch (selection?.type) {
      case 'checkbox':
        return selection.select(nodeId);
      case 'click':
        return selection.select(nodeId, multiple, nested);
      default:
        return tree.selectNode(nodeId, !stateSelected);
    }
  }

  function handleClick() {
    tree.clickNode(nodeId);
  }

  const keyboardActions = useObjectRef({
    async activate() {
      await handleSelect();
      await tree.activateNode(nodeId);
    },
    setExpanded(state: boolean) {
      return tree.expandNode(nodeId, state);
    },
  });
  const setNodeRef = useCallback(
    (element: HTMLDivElement | null) => keyboardNavigation.registerNode(nodeId, element, keyboardActions),
    [keyboardActions, keyboardNavigation, nodeId],
  );

  const ControlRenderer = controlRenderer || NodeControl;
  const ChildrenRenderer = childrenRenderer;

  return (
    <TreeNode
      ref={setNodeRef}
      nodeId={nodeId}
      tabIndex={keyboardNavigation.activeNodeId === nodeId ? 0 : -1}
      selected={selected}
      expanded={expanded}
      leaf={isNodeLeaf}
      className={clsx({
        'tree-node--dnd-drop-target': isValidDropTarget,
        'tree-node--dnd-dragging': dnd.state.isDragging,
      })}
      onExpand={handleToggleExpand}
      onOpen={handleOpen}
      onSelect={handleSelect}
      onClick={handleClick}
    >
      <ControlRenderer ref={dnd.setRef} nodeId={nodeId} />
      {expanded && <ChildrenRenderer nodeId={nodeId} offsetHeight={offsetHeight + tree.getNodeHeight(nodeId)} />}
    </TreeNode>
  );
});
