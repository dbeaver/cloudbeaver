/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NodesManagerService, TabEntity } from '@dbeaver/core/app';
import { ITab } from '@dbeaver/core/blocks';
import { injectable } from '@dbeaver/core/di';

import { ObjectFolderTabModel } from './ObjectFolderTabModel';

@injectable()
export class ObjectFoldersTabService {

  constructor(private nodesManagerService: NodesManagerService) {
  }

  createTabEntities(nodeId: string): TabEntity[] {
    return this.tabBuilder(nodeId).map(tab => new TabEntity(tab));
  }


  private tabBuilder(nodeId: string): ITab[] {
    const children = this.nodesManagerService.getChildren(nodeId)?.children || [];

    const folderTabs = children.filter((nodeId) => {
      const node = this.nodesManagerService.getNode(nodeId);
      return node ? node.folder : false;
    });

    const tabList: ITab[] = folderTabs.map((nodeId) => {
      const node = this.nodesManagerService.getNode(nodeId);
      if (!node) {
        throw Error(`node not found: ${nodeId}`);
      }

      return new ObjectFolderTabModel(
        node,
        () => this.nodesManagerService.navToNode(node.id)
      );
    });
    return tabList;
  }
}
