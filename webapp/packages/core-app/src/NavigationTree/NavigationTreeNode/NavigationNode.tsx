/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
  path,
  expanded: expandedExternal,
}) {
  const {
    empty,
    group,
    control,
    disabled,
    selected,
    loading,
    expanded,
    leaf,
    handleClick,
    handleExpand,
    handleOpen,
    handleSelect,
  } = useNavigationNode(node, path);

  const Control = control || NavigationNodeControl;

  if (leaf || empty) {
    expandedExternal = false;
  }

  return (
    <TreeNode
      group={group}
      loading={loading}
      disabled={disabled}
      selected={selected}
      expanded={expanded}
      externalExpanded={expandedExternal}
      leaf={leaf}
      onExpand={handleExpand}
      onClick={handleClick}
      onOpen={handleOpen}
      onSelect={handleSelect}
    >
      <Control node={node} />
      {(expanded || expandedExternal) && <NavigationNodeNested nodeId={node.id} path={path} component={component} />}
    </TreeNode>
  );
});
