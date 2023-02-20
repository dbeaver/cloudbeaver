/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled, { css, use } from 'reshadow';

import { Translate, TreeNodeNestedMessage, TREE_NODE_STYLES } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT, ProjectsService } from '@cloudbeaver/core-projects';

import { useNode } from '../../NodesManager/useNode';
import { ElementsTreeContext } from '../ElementsTree/ElementsTreeContext';
import type { NavigationNodeRendererComponent } from '../ElementsTree/NavigationNodeComponent';
import { NavigationNodeRendererLoader } from '../ElementsTree/NavigationTreeNode/NavigationNodeRendererLoader';
import type { IElementsTreeCustomRenderer } from '../ElementsTree/useElementsTree';
import { NavigationNodeProjectControl } from './NavigationNodeProjectControl';

const nestedStyles = css`
  TreeNode {
    margin-top: 8px;

    &[|project]:only-child,
    &[|hideProjects] {
      margin-top: 0px;

      & Control {
        display: none;
      }
    }

    & NavigationNodeNested {
      padding-left: 0 !important;
    }
  }
`;

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
  const projectsService = useService(ProjectsService);
  const elementsTreeContext = useContext(ElementsTreeContext);

  const { node } = useNode(nodeId);

  const singleProject = projectsService.activeProjects.length === 1;
  const isDragging = !!elementsTreeContext?.tree.activeDnDData.length;
  const hideProjects = elementsTreeContext?.tree.settings?.projects === false && !isDragging;

  if (!node) {
    return styled(TREE_NODE_STYLES)(
      <TreeNodeNestedMessage>
        <Translate token='app_navigationTree_node_not_found' />
      </TreeNodeNestedMessage>
    );
  }

  const project = node.nodeType === NAV_NODE_TYPE_PROJECT && singleProject && !isDragging;

  return styled(nestedStyles)(
    <NavigationNodeRendererLoader
      node={node}
      path={path}
      expanded={expanded}
      dragging={dragging}
      className={className}
      control={NavigationNodeProjectControl}
      style={nestedStyles}
      component={component}
      {...use({ hideProjects, project })}
    />
  );
});
