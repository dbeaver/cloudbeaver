/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { NavigationNode } from './NavigationNode/NavigationNode';
import { NavigationNodeChildren } from './NavigationNodeChildren';
import { TreeNodeMenu } from './TreeNodeMenu/TreeNodeMenu';
import { useNavigationTree } from './useNavigationTree';

type NavigationTreeNodeProps = {
  id: string;
  parentId: string;
}

export const NavigationTreeNode = observer(function NavigationTreeNodeFn({
  id,
  parentId,
}: NavigationTreeNodeProps) {
  const node = useNavigationTree(id, parentId);

  if (!node) {
    return null;
  }

  return (
    <NavigationNode
      id={id}
      title={node.name}
      icon={node.icon}
      isSelected={node.isSelected}
      isExpanded={node.isExpanded}
      isLoading={node.isLoading}
      isExpandable={node.isExpandable}
      onExpand={node.handleExpand}
      onClick={node.handleSelect}
      onDoubleClick={node.handleDoubleClick}
      portal={<TreeNodeMenu node={node.node} isSelected={node.isSelected} />}
    >
      <NavigationNodeChildren
        parentId={id}
        component={NavigationTreeNode} />
    </NavigationNode>
  );
});
