/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useNode } from '../../shared/NodesManager/useNode';
import { NavigationNode } from './NavigationNode/NavigationNode';
import { NavigationNodeChildren } from './NavigationNodeChildren';

type NavigationTreeNodeProps = {
  id: string;
  parentId: string;
}

export const NavigationTreeNode = observer(function NavigationTreeNodeFn({
  id,
  parentId,
}: NavigationTreeNodeProps) {
  const {
    node, isLoaded, isLoading, isOutdated,
  } = useNode(id);

  if (!node) {
    return null;
  }

  return (
    <NavigationNode node={node} isLoaded={isLoaded} isLoading={isLoading} isOutdated={isOutdated}>
      <NavigationNodeChildren
        parentId={id}
        component={NavigationTreeNode} />
    </NavigationNode>
  );
});
