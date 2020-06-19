/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService, TabEntity } from '@cloudbeaver/core-app';
import { ITab } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';

import { ObjectFolderTabModel } from './ObjectFolderTabModel';

@injectable()
export class ObjectFoldersTabService {

  constructor(private navNodeManagerService: NavNodeManagerService) {
  }

  createTabEntities(nodeId: string): TabEntity[] {
    return this.tabBuilder(nodeId).map(tab => new TabEntity(tab));
  }

  private tabBuilder(nodeId: string): ITab[] {
    const children = this.navNodeManagerService.getTree(nodeId) || [];

    const folderTabs = children.filter((nodeId) => {
      const node = this.navNodeManagerService.getNode(nodeId);
      return node ? node.folder : false;
    });

    const tabList: ITab[] = folderTabs.map((nodeId) => {
      const node = this.navNodeManagerService.getNode(nodeId);
      if (!node) {
        throw Error(`node not found: ${nodeId}`);
      }

      return new ObjectFolderTabModel(
        node,
        () => this.navNodeManagerService.navToNode(node.id, node.parentId)
      );
    });
    return tabList;
  }
}
