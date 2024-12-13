/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { untracked } from 'mobx';

import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NAV_NODE_TYPE_FOLDER, type NavNode, NavNodeInfoResource, ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';
import { NAV_NODE_TYPE_PROJECT, type ProjectInfo, ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey, resourceKeyList } from '@cloudbeaver/core-resource';
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
    private readonly projectInfoResource: ProjectInfoResource,
  ) {
    this.getSelectedProject = this.getSelectedProject.bind(this);
    this.getSelectedNode = this.getSelectedNode.bind(this);
  }

  getSelectedNode(tree: IElementsTree, nodeIdGetter: NodeIdGetter): ISelectedNode | undefined {
    untracked(() => this.projectInfoResource.load(CachedMapAllKey));
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

    const projectNode = this.getProjectNode(tree);

    if (!projectNode) {
      return;
    }

    const project = this.getSelectedProject(tree);

    if (!project?.canEditDataSources) {
      return;
    }

    const selectedFolderNode = this.getSelectedFolderNode(tree);

    return {
      projectId: project.id,
      folderId: selectedFolderNode?.id,
      projectNodeId: projectNode.id,
      selectProject: false,
    };
  }

  getSelectedProject(tree: IElementsTree): ProjectInfo | undefined {
    const projectNode = this.getProjectNode(tree);

    if (!projectNode) {
      return;
    }

    return this.projectsNavNodeService.getByNodeId(projectNode.id);
  }

  private getParents(tree: IElementsTree): NavNode[] {
    const selected = tree.getSelected();
    const selectedFolder = selected[0]!;
    const parentIds = [...this.navNodeInfoResource.getParents(selectedFolder), selectedFolder];
    return this.navNodeInfoResource.get(resourceKeyList(parentIds)).filter(isNotNullDefined);
  }

  private getProjectNode(tree: IElementsTree): NavNode | undefined {
    const parents = this.getParents(tree);

    return parents.find(parent => parent?.nodeType === NAV_NODE_TYPE_PROJECT);
  }

  private getSelectedFolderNode(tree: IElementsTree): NavNode | undefined {
    const parents = this.getParents(tree);

    return parents
      .slice()
      .reverse()
      .find(parent => parent?.nodeType === NAV_NODE_TYPE_FOLDER);
  }
}
