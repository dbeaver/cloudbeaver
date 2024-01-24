/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { TreeNode } from '@cloudbeaver/core-blocks';

import { TreeContext } from './contexts/TreeContext';
import { TreeDataContext } from './contexts/TreeDataContext';
import type { NodeComponent } from './INodeRenderer';
import { NodeControl } from './NodeControl';
import { useNodeDnD } from './useNodeDnD';

export const Node: NodeComponent = observer(function Node({ nodeId, offsetHeight, childrenRenderer }) {
  const tree = useContext(TreeContext)!;
  const data = useContext(TreeDataContext)!;

  const { expanded, selected } = data.getState(nodeId);

  const dndData = useNodeDnD(nodeId, () => {
    if (!selected) {
      tree.selectNode(nodeId, true);
    }
  });

  function handleOpen() {
    return tree.openNode(nodeId);
  }

  function handleToggleExpand() {
    return tree.expandNode(nodeId, !expanded);
  }

  function handleSelect() {
    tree.selectNode(nodeId, !selected);
  }

  const NavigationTreeChildrenNew = childrenRenderer;

  return (
    <TreeNode selected={selected} expanded={expanded} onExpand={handleToggleExpand} onOpen={handleOpen} onSelect={handleSelect}>
      <NodeControl ref={dndData.setTargetRef} nodeId={nodeId} />
      {expanded && <NavigationTreeChildrenNew nodeId={nodeId} offsetHeight={offsetHeight + tree.getNodeHeight(nodeId)} />}
    </TreeNode>
  );
});
