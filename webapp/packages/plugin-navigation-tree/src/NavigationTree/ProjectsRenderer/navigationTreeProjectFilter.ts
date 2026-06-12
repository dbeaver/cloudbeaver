/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  isProjectNode,
  type NavNode,
  NavNodeInfoResource,
  NavTreeResource,
  NodeManagerUtils,
  ProjectsNavNodeService,
  ROOT_NODE_PATH,
} from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';

import type { IElementsTreeFilter } from '../ElementsTree/useElementsTree.js';

export function navigationTreeProjectFilter(
  projectsNavNodeService: ProjectsNavNodeService,
  projectsService: ProjectsService,
  navNodeInfoResource: NavNodeInfoResource,
  navTreeResource: NavTreeResource,
): IElementsTreeFilter {
  return (tree, filter, node, children) => {
    if (node.uri !== ROOT_NODE_PATH) {
      return children;
    }

    const nodes = navNodeInfoResource
      .get(resourceKeyList(children))
      .filter<NavNode>((node => node !== undefined) as (node: NavNode | undefined) => node is NavNode)
      .filter(node => {
        if (isProjectNode(node)) {
          const project = projectsNavNodeService.getProject(node.uri);

          if (!project || !projectsService.activeProjects.includes(project)) {
            return false;
          }

          return navTreeResource.get(node.uri)?.length;
        }

        return NodeManagerUtils.isDatabaseObject(node.uri);
      })
      .map(node => node.uri);

    return nodes;
  };
}
