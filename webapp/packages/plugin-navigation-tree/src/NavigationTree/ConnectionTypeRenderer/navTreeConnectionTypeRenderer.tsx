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
import { NavNodeInfoResource, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { createConnectionParam, useConnectionTypeColor } from '@cloudbeaver/core-connections';
import { clsx } from '@dbeaver/ui-kit';

import type { NavigationNodeRendererComponent } from '../ElementsTree/NavigationNodeComponent.js';
import { NavigationNodeRendererLoader } from '../ElementsTree/NavigationTreeNode/NavigationNodeRendererLoader.js';
import type { IElementsTreeCustomRenderer } from '../ElementsTree/useElementsTree.js';

export function navTreeConnectionTypeRenderer(navNodeInfoResource: NavNodeInfoResource): IElementsTreeCustomRenderer {
  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node && node.projectId && node.objectId && NodeManagerUtils.isDatabaseObject(node.uri)) {
      return ConnectionTypeRenderer;
    }

    return undefined;
  };
}

const ConnectionTypeRenderer: NavigationNodeRendererComponent = observer(function ConnectionTypeRenderer({
  nodeId,
  path,
  dragging,
  component,
  className,
  expanded,
}) {
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const node = navNodeInfoResource.get(nodeId);

  const connectionKey = node?.projectId && node.objectId ? createConnectionParam(node.projectId, node.objectId) : undefined;
  const typeColor = useConnectionTypeColor(connectionKey);

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
      className={clsx(typeColor && 'tw:[&>*:first-child]:border-l-2 tw:[&>*:first-child]:border-l-[var(--connection-type-color)]', className)}
      style={typeColor ? ({ ['--connection-type-color']: typeColor } as React.CSSProperties) : undefined}
      component={component}
    />
  );
});
