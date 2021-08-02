/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { TreeNode } from '@cloudbeaver/core-blocks';

import type { NavigationNodeComponent } from '../NavigationNodeComponent';
import { NavigationNodeControl } from './NavigationNode/NavigationNodeControl';
import { NavigationNodeNested } from './NavigationNode/NavigationNodeNested';
import { useNavigationNode } from './useNavigationNode';

export const NavigationNode: NavigationNodeComponent = observer(function NavigationNode({
  node,
  component,
}) {
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
      {expanded && <NavigationNodeNested nodeId={node.id} component={component} />}
    </TreeNode>
  );
});
