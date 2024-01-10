/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, SContext, StyleRegistry, Translate, TreeNodeNestedMessage, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_PROJECT, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';
import {
  ElementsTreeContext,
  type IElementsTreeCustomRenderer,
  isDraggingInsideProject,
  NavigationNodeControlRendererStyles,
  NavigationNodeNestedStyles,
  type NavigationNodeRendererComponent,
  NavigationNodeRendererLoader,
  useNode,
} from '@cloudbeaver/plugin-navigation-tree';
import type { ResourceManagerService } from '@cloudbeaver/plugin-resource-manager';

import { NavigationNodeProjectControl } from './NavigationNodeProjectControl';
import style from './NavigationTreeProjectsRendererRenderer.m.css';

const registry: StyleRegistry = [
  [
    NavigationNodeNestedStyles,
    {
      mode: 'append',
      styles: [style],
    },
  ],
  [
    NavigationNodeControlRendererStyles,
    {
      mode: 'append',
      styles: [style],
    },
  ],
];

export function navigationTreeProjectsRendererRenderer(
  navNodeInfoResource: NavNodeInfoResource,
  resourceManagerService: ResourceManagerService,
  projectsNavNodeService: ProjectsNavNodeService,
  resourceTypeId?: string,
): IElementsTreeCustomRenderer {
  return nodeId => {
    const node = navNodeInfoResource.get(nodeId);

    if (node?.nodeType === NAV_NODE_TYPE_RM_PROJECT) {
      return ProjectRenderer;
    }

    if (!node?.folder || resourceTypeId === undefined) {
      return undefined;
    }

    const project = projectsNavNodeService.getProject(nodeId);

    if (!project) {
      return undefined;
    }

    const resourceFolder = resourceManagerService.getRootFolder(project, resourceTypeId);
    const folderNodeId = createPath(RESOURCES_NODE_PATH, project.id, resourceFolder);

    if (nodeId === folderNodeId) {
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
  const styles = useS(style);
  const projectsService = useService(ProjectsService);
  const elementsTreeContext = useContext(ElementsTreeContext);

  const { node } = useNode(nodeId);

  const isDragging = getComputed(() => {
    if (!node?.projectId || !elementsTreeContext?.tree.activeDnDData) {
      return false;
    }

    return isDraggingInsideProject(node.projectId, elementsTreeContext.tree.activeDnDData);
  });

  const hideProjects = elementsTreeContext?.tree.settings?.projects === false && !isDragging;
  const singleProject = projectsService.activeProjects.length === 1;

  if (!node) {
    return (
      <TreeNodeNestedMessage>
        <Translate token="app_navigationTree_node_not_found" />
      </TreeNodeNestedMessage>
    );
  }

  const project = node.nodeType === NAV_NODE_TYPE_RM_PROJECT && singleProject && !isDragging;

  return (
    <SContext registry={registry}>
      <NavigationNodeRendererLoader
        node={node}
        path={path}
        expanded={expanded}
        dragging={dragging}
        className={s(styles, { projectNode: true, hideProjects, project }, className)}
        control={NavigationNodeProjectControl}
        component={component}
      />
    </SContext>
  );
});
