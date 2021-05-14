/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { useService } from '@cloudbeaver/core-di';

import { NavNodeInfoResource } from '../../shared/NodesManager/NavNodeInfoResource';
import { TreeContext } from '../TreeContext';
import { NavigationNode } from './NavigationNode';

interface NavigationTreeNodeProps {
  nodeId: string;
}

export const NavigationNodeElement = observer(function NavigationNodeElement({
  nodeId,
}: NavigationTreeNodeProps) {
  const context = useContext(TreeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);

  if (context?.tree.renderers) {
    for (const renderer of context.tree.renderers) {
      const CustomRenderer = renderer(nodeId);

      if (CustomRenderer === undefined) {
        continue;
      }

      return <CustomRenderer nodeId={nodeId} component={NavigationNodeElement} />;
    }
  }

  const node = navNodeInfoResource.get(nodeId);

  if (!node) {
    return null;
  }

  // TODO: after node update reference can be lost and NavigationNode skip update
  return <NavigationNode node={node} component={NavigationNodeElement} />;
});
