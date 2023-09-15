/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';
import styled, { use } from 'reshadow';

import {
  ConnectionImageWithMask,
  getComputed,
  Loader,
  TreeNodeContext,
  TreeNodeControl,
  TreeNodeIcon,
  TreeNodeName,
  useMouseContextMenu,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { EObjectFeature, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import type { NavTreeControlComponent, NavTreeControlProps } from '../ElementsTree/NavigationNodeComponent';
import { NAVIGATION_NODE_CONTROL_STYLES } from '../ElementsTree/NavigationTreeNode/NavigationNode/NAVIGATION_NODE_CONTROL_STYLES';
import { NavigationNodeExpand } from '../ElementsTree/NavigationTreeNode/NavigationNode/NavigationNodeExpand';
import { TreeNodeMenuLoader } from '../ElementsTree/NavigationTreeNode/TreeNodeMenu/TreeNodeMenuLoader';

export const ConnectionNavNodeControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function ConnectionNavNodeControl({ node, nodeInfo, dndElement, dndPlaceholder, className, onClick }, ref) {
    const mouseContextMenu = useMouseContextMenu();
    const treeNodeContext = useContext(TreeNodeContext);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const navTreeResource = useService(NavTreeResource);
    const selected = treeNodeContext.selected;

    const error = getComputed(() => !!navNodeInfoResource.getException(node.id) || !!navTreeResource.getException(node.id));
    const connected = getComputed(() => node.objectFeatures.includes(EObjectFeature.dataSourceConnected));

    let icon = nodeInfo.icon;
    const name = nodeInfo.name;
    const title = nodeInfo.name;

    if (error) {
      icon = '/icons/error_icon_sm.svg';
    }

    function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
      EventContext.set(event, EventStopPropagationFlag);
      treeNodeContext.select();
    }

    function handleContextMenuOpen(event: React.MouseEvent<HTMLDivElement>) {
      mouseContextMenu.handleContextMenuOpen(event);
      treeNodeContext.select();
    }

    return styled(NAVIGATION_NODE_CONTROL_STYLES)(
      <TreeNodeControl ref={ref} className={className} onClick={onClick} onContextMenu={handleContextMenuOpen} {...use({ dragging: dndElement })}>
        <NavigationNodeExpand nodeId={node.id} />
        <TreeNodeIcon {...use({ connected })}>
          <ConnectionImageWithMask icon={icon} connected={connected} maskId="tree-node-icon" />
        </TreeNodeIcon>
        <TreeNodeName title={title}>
          <Loader suspense inline fullSize>
            <name-box>{name}</name-box>
          </Loader>
        </TreeNodeName>
        {!dndPlaceholder && (
          <portal onClick={handlePortalClick}>
            <TreeNodeMenuLoader mouseContextMenu={mouseContextMenu} node={node} selected={selected} />
          </portal>
        )}
      </TreeNodeControl>,
    );
  }),
);
