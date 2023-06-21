/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, TREE_NODE_STYLES, TreeNodeContext, TreeNodeControl, TreeNodeName, useMouseContextMenu } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../ElementsTree/ElementsTreeContext';
import type { NavTreeControlComponent, NavTreeControlProps } from '../ElementsTree/NavigationNodeComponent';
import { isDraggingInsideProject } from '../ElementsTree/NavigationTreeNode/isDraggingInsideProject';
import { TreeNodeMenuLoader } from '../ElementsTree/NavigationTreeNode/TreeNodeMenu/TreeNodeMenuLoader';

const styles = css`
  TreeNodeControl {
    transition: opacity 0.3s ease;
    opacity: 1;

    &[|outdated] {
      opacity: 0.5;
    }
  }
  TreeNodeControl:hover > portal,
  TreeNodeControl:global([aria-selected='true']) > portal,
  portal:focus-within {
    visibility: visible;
  }
  TreeNodeName {
    composes: theme-text-text-hint-on-light theme-typography--caption from global;
    height: 100%;
    max-width: 250px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  portal {
    position: relative;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 8px !important;
    visibility: hidden;
  }
  name-box {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

export const NavigationNodeProjectControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function NavigationNodeProjectControl({ node, dndElement, dndPlaceholder, className }, ref) {
    const mouseContextMenu = useMouseContextMenu();
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
      mouseContextMenu.handleContextMenuOpen(event);
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

    return styled(
      TREE_NODE_STYLES,
      styles,
    )(
      <TreeNodeControl
        ref={ref}
        onClick={handleClick}
        onDoubleClick={handleDbClick}
        onContextMenu={handleContextMenuOpen}
        {...use({ outdated, dragging: dndElement })}
        className={className}
      >
        <TreeNodeName title={node.name}>
          <name-box>{node.name}</name-box>
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
