/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, s, SContext, StyleRegistry, Translate, TreeNodeNestedMessage, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT, ProjectsService } from '@cloudbeaver/core-projects';

import { NavigationNodeControlRendererStyles, NavigationNodeNestedStyles } from '../../index';
import { useNode } from '../../NodesManager/useNode';
import { ElementsTreeContext } from '../ElementsTree/ElementsTreeContext';
import type { NavigationNodeRendererComponent } from '../ElementsTree/NavigationNodeComponent';
import { isDraggingInsideProject } from '../ElementsTree/NavigationTreeNode/isDraggingInsideProject';
import { NavigationNodeRendererLoader } from '../ElementsTree/NavigationTreeNode/NavigationNodeRendererLoader';
import type { IElementsTreeCustomRenderer } from '../ElementsTree/useElementsTree';
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

export function navigationTreeProjectsRendererRenderer(navNodeInfoResource: NavNodeInfoResource): IElementsTreeCustomRenderer {
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

  const singleProject = projectsService.activeProjects.length === 1;
  const hideProjects = elementsTreeContext?.tree.settings?.projects === false && !isDragging;

  if (!node) {
    return (
      <TreeNodeNestedMessage>
        <Translate token="app_navigationTree_node_not_found" />
      </TreeNodeNestedMessage>
    );
  }

  const project = node.nodeType === NAV_NODE_TYPE_PROJECT && singleProject && !isDragging;

  return (
    <SContext registry={registry}>
      <NavigationNodeRendererLoader
        node={node}
        path={path}
        expanded={expanded}
        dragging={dragging}
        className={s(styles, { treeNode: true, hideProjects, project }, className)}
        control={NavigationNodeProjectControl}
        component={component}
      />
    </SContext>
  );
});
