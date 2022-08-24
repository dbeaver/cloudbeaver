/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { Translate } from '@cloudbeaver/core-localization';
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT } from '@cloudbeaver/core-projects';

import { useNode } from '../../NodesManager/useNode';
import type { NavigationNodeRendererComponent } from '../ElementsTree/NavigationNodeComponent';
import { NavigationNodeRenderer } from '../ElementsTree/NavigationTreeNode/NavigationNodeRenderer';
import type { IElementsTreeCustomRenderer } from '../ElementsTree/useElementsTree';
import { NavigationNodeProjectControl } from './NavigationNodeProjectControl';

export function navigationTreeProjectsRendererRenderer(
  navNodeInfoResource: NavNodeInfoResource
): IElementsTreeCustomRenderer {

  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType === NAV_NODE_TYPE_PROJECT) {
      return ProjectRenderer;
    }

    return undefined;
  };
}

const ProjectRenderer: NavigationNodeRendererComponent = observer(function ManageableGroup({
  nodeId,
  path,
  dragging,
  component,
  className,
  expanded,
}) {
  const { node } = useNode(nodeId);

  if (!node) {
    return styled(TREE_NODE_STYLES)(
      <TreeNodeNestedMessage>
        <Translate token='app_navigationTree_node_not_found' />
      </TreeNodeNestedMessage>
    );
  }

  return (
    <NavigationNodeRenderer
      node={node}
      path={path}
      expanded={expanded}
      dragging={dragging}
      className={className}
      control={NavigationNodeProjectControl}
      component={component}
    />
  );
});
