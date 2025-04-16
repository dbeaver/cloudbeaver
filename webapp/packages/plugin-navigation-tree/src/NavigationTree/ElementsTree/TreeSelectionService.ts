/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { type NavNode, NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { type ProjectInfo, ProjectsService } from '@cloudbeaver/core-projects';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { isNotNullDefined } from '@dbeaver/js-helpers';

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
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly projectsService: ProjectsService,
    private readonly projectsNavNodeService: ProjectsNavNodeService,
  ) {
    this.getSelectedProject = this.getSelectedProject.bind(this);
    this.getFirstSelectedNode = this.getFirstSelectedNode.bind(this);
  }

  // Should preload ProjectInfoResource. Cause the resource used indirectly (TODO make it directly used)
  getFirstSelectedNode(
    tree: IElementsTree,
    nodeIdGetter: NodeIdGetter,
    projectPredicate: (project: ProjectInfo) => boolean,
    nodePredicate: (node: NavNode | undefined) => boolean,
    folderPredicate: (node: NavNode | undefined) => boolean,
  ): ISelectedNode | undefined {
    const selected = tree.getSelected();

    if (selected.length === 0) {
      const editableProjects = this.projectsService.activeProjects.filter(projectPredicate);

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

    const project = this.getSelectedProject(tree, nodePredicate);

    if (!project || !projectPredicate(project)) {
      return;
    }

    const selectedFolderNode = this.getParents(tree).slice().reverse().find(folderPredicate);

    return {
      projectId: project.id,
      folderId: selectedFolderNode?.id,
      projectNodeId: nodeIdGetter(project.id),
      selectProject: false,
    };
  }

  // Should preload ProjectInfoResource. Cause the resource used indirectly (TODO make it directly used)
  getSelectedProject(tree: IElementsTree, nodePredicate: (node: NavNode | undefined) => boolean): ProjectInfo | undefined {
    const projectNode = this.getParents(tree).find(nodePredicate);

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
