/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { isConnectionFolder, isProjectNode, type NavNode, NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { type ProjectInfo } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import type { IElementsTree } from './useElementsTree.js';

interface ISelectedNode {
  projectId: string;
  folderId?: string;
  projectNodeId: string;
  selectProject: boolean;
}

type NodeIdGetter = (projectId: string) => string;

@injectable()
export class TreeSelectionService {
  constructor(
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
  ) {
    this.getSelectedProject = this.getSelectedProject.bind(this);
    this.getFirstSelectedNode = this.getFirstSelectedNode.bind(this);
  }

  // Should preload ProjectInfoResource. Cause the resource used indirectly (TODO make it directly used)
  getFirstSelectedNode(tree: IElementsTree, nodeIdGetter: NodeIdGetter): ISelectedNode | undefined {
    const selected = tree.getSelected();

    if (selected.length === 0) {
      const editableProjects = this.connectionsManagerService.createConnectionProjects;

      if (editableProjects.length > 0) {
        const project = editableProjects[0]!;

        return {
          projectId: project.id,
          projectNodeId: nodeIdGetter(project.id),
          selectProject: editableProjects.length > 1,
        };
      }

      return;
    }

    const project = this.getSelectedProject(tree);

    if (!project?.canEditDataSources) {
      return;
    }

    const selectedFolderNode = this.getParents(tree).slice().reverse().find(isConnectionFolder);

    return {
      projectId: project.id,
      folderId: selectedFolderNode?.id,
      projectNodeId: nodeIdGetter(project.id),
      selectProject: false,
    };
  }

  // Should preload ProjectInfoResource. Cause the resource used indirectly (TODO make it directly used)
  getSelectedProject(tree: IElementsTree): ProjectInfo | undefined {
    const projectNode = this.getParents(tree).find(isProjectNode);

    if (!projectNode) {
      return;
    }

    return this.projectsNavNodeService.getByNodeId(projectNode.id);
  }

  private getParents(tree: IElementsTree): NavNode[] {
    const selected = tree.getSelected();
    const selectedFolder = selected[0];

    if (!selectedFolder) {
      return [];
    }

    const parentIds = [...this.navNodeInfoResource.getParents(selectedFolder), selectedFolder];
    return this.navNodeInfoResource.get(resourceKeyList(parentIds)).filter(isNotNullDefined);
  }
}
