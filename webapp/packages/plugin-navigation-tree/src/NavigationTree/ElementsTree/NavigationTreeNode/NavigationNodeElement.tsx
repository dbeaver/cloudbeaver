/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Translate, TreeNodeNestedMessage } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../ElementsTreeContext.js';
import type { NavTreeNodeComponent } from '../NavigationNodeComponent.js';
import { NavigationNodeRendererLoader } from './NavigationNodeRendererLoader.js';

export const NavigationNodeElement: NavTreeNodeComponent = observer(function NavigationNodeElement({ nodeId, path, expanded, dragging, className }) {
  const context = useContext(ElementsTreeContext);

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

  return <NavigationNodeRenderer nodeId={nodeId} path={path} expanded={expanded} dragging={dragging} className={className} />;
});

const NavigationNodeRenderer: NavTreeNodeComponent = observer(function NavigationNodeRenderer({ nodeId, path, expanded, dragging, className }) {
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
      component={NavigationNodeElement}
    />
  );
});
