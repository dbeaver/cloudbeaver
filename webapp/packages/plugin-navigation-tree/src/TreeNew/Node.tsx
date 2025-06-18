/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { TreeNode } from '@cloudbeaver/core-blocks';

import { TreeContext } from './contexts/TreeContext.js';
import { TreeDataContext } from './contexts/TreeDataContext.js';
import type { NodeComponent } from './INodeRenderer.js';
import { NodeControl } from './NodeControl.js';
import { useNodeDnD } from './useNodeDnD.js';

export const Node: NodeComponent = observer(function Node({ nodeId, offsetHeight, controlRenderer, childrenRenderer }) {
  const tree = useContext(TreeContext)!;
  const data = useContext(TreeDataContext)!;

  const { expanded, selected } = data.getState(nodeId);

  const dndData = useNodeDnD(nodeId, () => {});

  function handleOpen() {
    return tree.openNode(nodeId);
  }

  function handleToggleExpand() {
    return tree.expandNode(nodeId, !expanded);
  }

  function handleSelect() {
    tree.selectNode(nodeId, !selected);
  }

  function handleClick() {
    tree.clickNode(nodeId);
  }

  const ControlRenderer = controlRenderer || NodeControl;
  const ChildrenRenderer = childrenRenderer;

  return (
    <TreeNode selected={selected} expanded={expanded} onExpand={handleToggleExpand} onOpen={handleOpen} onSelect={handleSelect} onClick={handleClick}>
      <ControlRenderer ref={dndData.setTargetRef} nodeId={nodeId} />
      {expanded && <ChildrenRenderer nodeId={nodeId} offsetHeight={offsetHeight + tree.getNodeHeight(nodeId)} />}
    </TreeNode>
  );
});
