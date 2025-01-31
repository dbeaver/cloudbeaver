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
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { isRMProjectNode } from '@cloudbeaver/core-resource-manager';
import { CaptureViewContext } from '@cloudbeaver/core-view';
import {
  ElementsTreeContext,
  isDraggingInsideProject,
  type NavTreeControlComponent,
  type NavTreeControlProps,
  TreeNodeMenuLoader,
} from '@cloudbeaver/plugin-navigation-tree';
import { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

import { getRmProjectNodeId } from '../../NavNodes/getRmProjectNodeId.js';
import { DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID } from '../DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID.js';
import style from './NavigationNodeProjectControl.module.css';

export const NavigationNodeProjectControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function NavigationNodeProjectControl({ node, dndElement, dndPlaceholder, className }, ref) {
    const styles = useS(style);
    const contextMenuPosition = useContextMenuPosition();
    const viewContext = useContext(CaptureViewContext);
    const elementsTreeContext = useContext(ElementsTreeContext);
    const treeNodeContext = useContext(TreeNodeContext);

    const projectInfoResource = useService(ProjectInfoResource);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const resourceManagerService = useService(ResourceManagerService);

    const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
    const selected = treeNodeContext.selected;
    const resourceType = viewContext?.get(DATA_CONTEXT_RESOURCE_MANAGER_TREE_RESOURCE_TYPE_ID);

    const isDragging = getComputed(() => {
      if (!node.projectId || !elementsTreeContext?.tree.activeDnDData) {
        return false;
      }

      return isDraggingInsideProject(node.projectId, elementsTreeContext.tree.activeDnDData);
    });

    let name = node.name;

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

    if (node.projectId && resourceType !== undefined) {
      if (isRMProjectNode(node)) {
        const project = projectInfoResource.get(node.projectId);
        if (project) {
          const resourceFolder = resourceManagerService.getRootFolder(project, resourceType);

          if (resourceFolder !== undefined) {
            return null;
          }
        }
      } else {
        const project = getRmProjectNodeId(node.projectId);
        const projectName = navNodeInfoResource.get(project)?.name;

        if (projectName) {
          name = projectName;
        }
      }
    }

    if (elementsTreeContext?.tree.settings?.projects === false && !isDragging) {
      return null;
    }

    return (
      <TreeNodeControl
        ref={ref}
        className={s(styles, { treeNodeControl: true, outdated }, className)}
        onClick={handleClick}
        onContextMenu={handleContextMenuOpen}
      >
        <TreeNodeName title={name} className={s(styles, { treeNodeName: true })}>
          <div className={s(styles, { nameBox: true })}>{name}</div>
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
