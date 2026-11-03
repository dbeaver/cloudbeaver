/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type ComponentProps, useContext } from 'react';

import { ElementsTreeContext } from '../ElementsTreeContext.js';
import type { NavTreeNodeComponent } from '../NavigationNodeComponent.js';
import { DefaultNavigationNodeRenderer } from './DefaultNavigationNodeRenderer.js';

function NavigationNodeElementRender({ nodeId, path, expanded, dragging, className }: ComponentProps<NavTreeNodeComponent>) {
  const context = useContext(ElementsTreeContext);

  if (context?.tree.renderers) {
    for (const { matches, Component } of context.tree.renderers) {
      if (matches(nodeId)) {
        return (
          <Component
            nodeId={nodeId}
            path={path}
            expanded={expanded}
            dragging={dragging}
            className={className}
            component={NavigationNodeElementRender}
          />
        );
      }
    }
  }

  return (
    <DefaultNavigationNodeRenderer
      nodeId={nodeId}
      path={path}
      expanded={expanded}
      dragging={dragging}
      className={className}
      component={NavigationNodeElement}
    />
  );
}

export const NavigationNodeElement: NavTreeNodeComponent = observer(NavigationNodeElementRender);
