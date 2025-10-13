/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useContext } from 'react';

import { TreeNodeControl, TreeNodeExpand, TreeNodeIcon, TreeNodeName } from '@cloudbeaver/core-blocks';

import { TreeContext } from './contexts/TreeContext.js';
import { TreeDataContext } from './contexts/TreeDataContext.js';
import type { NodeControlComponent } from './INodeRenderer.js';

export const NodeControl: NodeControlComponent = observer(
  forwardRef(function NodeControl({ nodeId }, ref) {
    const data = useContext(TreeDataContext)!;
    const tree = useContext(TreeContext)!;

    const node = data.getNode(nodeId);
    const height = tree.getNodeHeight(nodeId);

    return (
      <TreeNodeControl ref={ref} style={{ height }}>
        <TreeNodeExpand leaf={node.leaf} />
        <TreeNodeIcon icon={node.icon} />
        <TreeNodeName title={node.tooltip ?? node.name}>{node.name}</TreeNodeName>
      </TreeNodeControl>
    );
  }),
);
