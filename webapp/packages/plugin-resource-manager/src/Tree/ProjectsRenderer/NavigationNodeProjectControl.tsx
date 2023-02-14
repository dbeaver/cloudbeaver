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
import { NAV_NODE_TYPE_RM_PROJECT } from '@cloudbeaver/core-resource-manager';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import { ElementsTreeContext, NavigationNodeEditor, NavTreeControlComponent, NavTreeControlProps, TreeNodeMenu } from '@cloudbeaver/plugin-navigation-tree';

import { getRmProjectNodeId } from '../../NavNodes/getRmProjectNodeId';
import { DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID } from '../DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID';


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
  const viewContext = useContext(CaptureViewContext);
  const elementsTreeContext = useContext(ElementsTreeContext);
  const treeNodeContext = useContext(TreeNodeContext);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
  const selected = treeNodeContext.selected;
  const resourceType = viewContext?.tryGet(DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID);

  const [editing, setEditing] = useState(false);
  let name = node.name;

  const nodeActions = useObjectRef<INodeActions>({
    rename: () => {
      setEditing(true);
    },
  });

  function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
    EventContext.set(event, EventStopPropagationFlag);
    treeNodeContext.select();
  }

  function onClickHandler(event: React.MouseEvent<HTMLDivElement>) {
    treeNodeContext.select(event.ctrlKey || event.metaKey);
  }

  if (
    node.nodeType === NAV_NODE_TYPE_RM_PROJECT
    && resourceType !== undefined
  ) {
    return null;
  } else if (resourceType !== undefined && node.projectId) {
    const project = getRmProjectNodeId(node.projectId);
    const projectName = navNodeInfoResource.get(project)?.name;

    if (projectName) {
      name = projectName;
    }
  }

  if (elementsTreeContext?.tree.settings?.projects === false) {
    return null;
  }

  return styled(TREE_NODE_STYLES, styles)(
    <TreeNodeControl
      ref={ref}
      onClick={onClickHandler}
      {...use({ outdated, editing, dragging: dndElement })}
      className={className}
    >
      <TreeNodeName title={name}>
        {editing ? (
          <NavigationNodeEditor node={node} onClose={() => setEditing(false)} />
        ) : (
          <name-box>{name}</name-box>
        )}
      </TreeNodeName>
      {!editing && !dndPlaceholder && (
        <portal onClick={handlePortalClick}>
          <TreeNodeMenu node={node} actions={nodeActions} selected={selected} />
        </portal>
      )}
    </TreeNodeControl>
  );
}));
