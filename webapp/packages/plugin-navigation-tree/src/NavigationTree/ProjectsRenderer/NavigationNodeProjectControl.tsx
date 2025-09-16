/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';

import { getComputed, s, TreeNodeContext, TreeNodeControl, TreeNodeName, useContextMenuPosition, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../ElementsTree/ElementsTreeContext.js';
import type { NavTreeControlComponent, NavTreeControlProps } from '../ElementsTree/NavigationNodeComponent.js';
import { isDraggingInsideProject } from '../ElementsTree/NavigationTreeNode/isDraggingInsideProject.js';
import { TreeNodeMenuLoader } from '../ElementsTree/NavigationTreeNode/TreeNodeMenu/TreeNodeMenuLoader.js';
import style from './NavigationNodeProjectControl.module.css';

export const NavigationNodeProjectControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function NavigationNodeProjectControl({ node, dndElement, dndPlaceholder, className }, ref) {
    const styles = useS(style);
    const contextMenuPosition = useContextMenuPosition();
    const treeNodeContext = useContext(TreeNodeContext);
    const elementsTreeContext = useContext(ElementsTreeContext);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
    const selected = treeNodeContext.selected;

    const isDragging = getComputed(() => {
      if (!node.projectId || !elementsTreeContext?.tree.activeDnDData) {
        return false;
      }

      return isDraggingInsideProject(node.projectId, elementsTreeContext.tree.activeDnDData);
    });

    function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
      EventContext.set(event, EventStopPropagationFlag);
      treeNodeContext.select();
    }

    function handleContextMenuOpen(event: React.MouseEvent<HTMLDivElement>) {
      contextMenuPosition.handleContextMenuOpen(event);
      treeNodeContext.select();
    }

    function handleClick(event: React.MouseEvent<HTMLDivElement>) {
      treeNodeContext.select(event.ctrlKey || event.metaKey);
    }

    function handleDbClick(event: React.MouseEvent<HTMLDivElement>) {
      elementsTreeContext?.tree.open(node, navNodeInfoResource.getParents(node.id), false);
    }

    if (elementsTreeContext?.tree.settings?.projects === false && !isDragging) {
      return null;
    }

    return (
      <TreeNodeControl
        ref={ref}
        className={s(styles, { treeNodeControl: true, outdated, dragging: isDragging }, className)}
        onClick={handleClick}
        onDoubleClick={handleDbClick}
        onContextMenu={handleContextMenuOpen}
      >
        <TreeNodeName className={s(styles, { treeNodeName: true })} title={node.name}>
          <div className={s(styles, { nameBox: true })}>{node.name}</div>
        </TreeNodeName>
        {!dndPlaceholder && (
          <div className={s(styles, { portal: true })} onClick={handlePortalClick}>
            <TreeNodeMenuLoader contextMenuPosition={contextMenuPosition} node={node} selected={selected} />
          </div>
        )}
      </TreeNodeControl>
    );
  }),
);

NavigationNodeProjectControl.displayName = 'NavigationNodeProjectControl';
