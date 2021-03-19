/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { TreeNode, TreeNodeContext } from '@cloudbeaver/core-blocks';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import { NavigationNodeControl } from './NavigationNode/NavigationNodeControl';
import { NavigationNodeNested } from './NavigationNode/NavigationNodeNested';
import { useNavigationNode } from './useNavigationNode';

interface Props {
  node: NavNode;
  component: React.FC<{
    nodeId: string;
  }>;
}

export const NavigationNode: React.FC<Props> = observer(function NavigationNode({
  node,
  component,
}) {
  const context = useContext(TreeNodeContext);

  const {
    control,
    selected,
    loading,
    expanded,
    leaf,
    handleExpand,
    handleOpen,
    handleSelect,
    handleFilter,
    filterValue,
  } = useNavigationNode(node);

  const Control = control || NavigationNodeControl;

  return (
    <TreeNode
      loading={loading}
      selected={selected}
      expanded={expanded}
      leaf={leaf}
      filterValue={filterValue}
      onExpand={handleExpand}
      onOpen={handleOpen}
      onSelect={handleSelect}
      onFilter={handleFilter}
    >
      <Control node={node} />
      <NavigationNodeNested nodeId={node.id} component={component} />
    </TreeNode>
  );
});
