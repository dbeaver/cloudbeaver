/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { getComputed, TreeNodeContext, TreeNodeControl, TreeNodeName, TREE_NODE_STYLES, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { NavNodeInfoResource, type INodeActions } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../ElementsTree/ElementsTreeContext';
import type { NavTreeControlComponent, NavTreeControlProps } from '../ElementsTree/NavigationNodeComponent';
import { isDraggingInsideProject } from '../ElementsTree/NavigationTreeNode/isDraggingInsideProject';
import { NavigationNodeEditorLoader } from '../ElementsTree/NavigationTreeNode/NavigationNode/NavigationNodeLoaders';
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
  TreeNodeControl:global([aria-selected=true]) > portal,
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

export const NavigationNodeProjectControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(forwardRef(function NavigationNodeProjectControl({
  node,
  dndElement,
  dndPlaceholder,
  className,
}, ref) {
  const treeNodeContext = useContext(TreeNodeContext);
  const elementsTreeContext = useContext(ElementsTreeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
  const selected = treeNodeContext.selected;

  const [editing, setEditing] = useState(false);

  const nodeActions = useObjectRef<INodeActions>({
    rename: () => {
      setEditing(true);
    },
  });

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

  function onClickHandler(event: React.MouseEvent<HTMLDivElement>) {
    treeNodeContext.select(event.ctrlKey || event.metaKey);
  }

  if (elementsTreeContext?.tree.settings?.projects === false && !isDragging) {
    return null;
  }

  return styled(TREE_NODE_STYLES, styles)(
    <TreeNodeControl
      ref={ref}
      onClick={onClickHandler}
      {...use({ outdated, editing, dragging: dndElement })}
      className={className}
    >
      <TreeNodeName title={node.name}>
        {editing ? (
          <NavigationNodeEditorLoader node={node} onClose={() => setEditing(false)} />
        ) : (
          <name-box>{node.name}</name-box>
        )}
      </TreeNodeName>
      {!editing && !dndPlaceholder && (
        <portal onClick={handlePortalClick}>
          <TreeNodeMenuLoader node={node} actions={nodeActions} selected={selected} />
        </portal>
      )}
    </TreeNodeControl>
  );
}));
