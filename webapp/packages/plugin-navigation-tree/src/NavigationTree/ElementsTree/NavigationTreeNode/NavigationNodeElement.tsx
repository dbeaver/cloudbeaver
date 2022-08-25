/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../ElementsTreeContext';
import type { NavTreeNodeComponent } from '../NavigationNodeComponent';
import { NavigationNodeRenderer } from './NavigationNodeRenderer';

export const NavigationNodeElement: NavTreeNodeComponent = observer(function NavigationNodeElement({
  nodeId,
  path,
  expanded,
  dragging,
  className,
}) {
  const context = useContext(ElementsTreeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);

  if (context?.tree.renderers) {
    for (const renderer of context.tree.renderers) {
      const CustomRenderer = renderer(nodeId);

      if (CustomRenderer) {
        return (
          <CustomRenderer
            nodeId={nodeId}
            path={path}
            expanded={expanded}
            dragging={dragging}
            className={className}
            component={NavigationNodeElement}
          />
        );
      }
    }
  }

  const node = navNodeInfoResource.get(nodeId);

  if (!node) {
    return styled(TREE_NODE_STYLES)(
      <TreeNodeNestedMessage>
        <Translate token='app_navigationTree_node_not_found' />
      </TreeNodeNestedMessage>
    );
  }

  // TODO: after node update reference can be lost and NavigationNode skip update
  return (
    <NavigationNodeRenderer
      node={node}
      path={path}
      expanded={expanded}
      dragging={dragging}
      className={className}
      component={NavigationNodeElement}
    />
  );
});
