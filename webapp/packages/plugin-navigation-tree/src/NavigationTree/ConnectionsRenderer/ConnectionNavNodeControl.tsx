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
  s,
  TreeNodeContext,
  TreeNodeControl,
  TreeNodeIcon,
  TreeNodeName,
  useMouseContextMenu,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { EObjectFeature, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import type { NavTreeControlComponent, NavTreeControlProps } from '../ElementsTree/NavigationNodeComponent';
import { NavigationNodeExpand } from '../ElementsTree/NavigationTreeNode/NavigationNode/NavigationNodeExpand';
import { TreeNodeMenuLoader } from '../ElementsTree/NavigationTreeNode/TreeNodeMenu/TreeNodeMenuLoader';
import style from '../NavigationNodeControl.m.css';

export const ConnectionNavNodeControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function ConnectionNavNodeControl({ node, nodeInfo, dndElement, dndPlaceholder, className, onClick }, ref) {
    const styles = useS(style);
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

    return (
      <TreeNodeControl
        ref={ref}
        className={s(styles, { treeNodeControl: true }, className)}
        dragging={!!dndElement}
        onClick={onClick}
        onContextMenu={handleContextMenuOpen}
      >
        <NavigationNodeExpand nodeId={node.id} />
        <TreeNodeIcon>
          <ConnectionImageWithMask icon={icon} connected={connected} maskId="tree-node-icon" />
        </TreeNodeIcon>
        <TreeNodeName title={title} className={s(styles, { treeNodeName: true })}>
          <Loader suspense inline fullSize>
            <div className={s(styles, { nameBox: true })}>{name}</div>
          </Loader>
        </TreeNodeName>
        {!dndPlaceholder && (
          <div className={s(styles, { portal: true })} onClick={handlePortalClick}>
            <TreeNodeMenuLoader mouseContextMenu={mouseContextMenu} node={node} selected={selected} />
          </div>
        )}
      </TreeNodeControl>
    );
  }),
);
