/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Translate, TreeNodeNestedMessage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import type { NavigationNodeRendererComponent } from '../NavigationNodeComponent.js';
import { NavigationNodeRendererLoader } from './NavigationNodeRendererLoader.js';

export const DefaultNavigationNodeRenderer: NavigationNodeRendererComponent = observer(function DefaultNavigationNodeRenderer({
  nodeId,
  path,
  expanded,
  dragging,
  className,
  component,
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

  return <NavigationNodeRendererLoader node={node} path={path} expanded={expanded} dragging={dragging} className={className} component={component} />;
});
