/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, TreeNodeNestedMessage } from '@cloudbeaver/core-blocks';
import { NAV_NODE_TYPE_CONNECTION } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { NavigationNodeRendererComponent } from '../ElementsTree/NavigationNodeComponent.js';
import { NavigationNodeRendererLoader } from '../ElementsTree/NavigationTreeNode/NavigationNodeRendererLoader.js';
import type { IElementsTreeCustomRenderer } from '../ElementsTree/useElementsTree.js';
import { ConnectionNavNodeControl } from './ConnectionNavNodeControl.js';

export function navTreeConnectionRenderer(navNodeInfoResource: NavNodeInfoResource): IElementsTreeCustomRenderer {
  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType === NAV_NODE_TYPE_CONNECTION) {
      return ConnectionRenderer;
    }

    return undefined;
  };
}

const ConnectionRenderer: NavigationNodeRendererComponent = observer(function ManageableGroup({
  nodeId,
  path,
  dragging,
  component,
  className,
  expanded,
}) {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const node = navNodeInfoResource.get(nodeId);

  if (!node) {
    return (
      <TreeNodeNestedMessage>
        <Translate token="app_navigationTree_node_not_found" />
      </TreeNodeNestedMessage>
    );
  }

  return (
    <NavigationNodeRendererLoader
      node={node}
      path={path}
      expanded={expanded}
      dragging={dragging}
      className={className}
      control={ConnectionNavNodeControl}
      component={component}
    />
  );
});
