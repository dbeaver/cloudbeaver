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
import type { NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { NAV_NODE_TYPE_RM_PROJECT, RESOURCES_NODE_PATH } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';
import { type IElementsTreeCustomRenderer, type NavigationNodeRendererComponent, useNode, NavigationNodeRenderer, ElementsTreeContext } from '@cloudbeaver/plugin-navigation-tree';

import type { ResourceManagerService } from '../../ResourceManagerService';
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
  const projectsService = useService(ProjectsService);
  const elementsTreeContext = useContext(ElementsTreeContext);
  const { node } = useNode(nodeId);
  const hideProjects = elementsTreeContext?.tree.settings?.projects === false;
  const singleProject = projectsService.activeProjects.length === 1;

  if (!node) {
    return styled(TREE_NODE_STYLES)(
      <TreeNodeNestedMessage>
        <Translate token='app_navigationTree_node_not_found' />
      </TreeNodeNestedMessage>
    );
  }

  const project = node.nodeType === NAV_NODE_TYPE_RM_PROJECT && singleProject;

  return styled(nestedStyles)(
    <NavigationNodeRenderer
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
