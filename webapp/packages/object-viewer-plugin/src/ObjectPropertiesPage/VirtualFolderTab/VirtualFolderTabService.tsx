/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NodesManagerService, NodeWithParent, TabEntity } from '@dbeaver/core/app';
import { injectable, MixinProvider } from '@dbeaver/core/di';

import { VirtualFolderTabData } from './VirtualFolderTabData';
import { VirtualFolderTabMixin } from './VirtualFolderTabMixin';
import { VirtualFolderTabModel } from './VirtualFolderTabModel';


@injectable()
export class VirtualFolderTabService {

  constructor(private nodesManagerService: NodesManagerService) {
  }

  createTabEntities(nodeId: string): TabEntity[] {
    const children = this.nodesManagerService.getChildren(nodeId)?.children || [];

    const notFolderNodes = children.reduce<NodeWithParent[]>(
      (nodes, nodeId) => {
        const node = this.nodesManagerService.getNode(nodeId);
        if (node && !node.folder) {
          nodes.push(node);
        }
        return nodes;
      },
      []
    );

    const virtualFolders = notFolderNodes.reduce<Map<string, VirtualFolderTabData>>(
      (map, node) => {
        const folderName = node?.nodeType || 'unknown';

        let tabData = map.get(folderName);
        if (!tabData) {
          tabData = new VirtualFolderTabData(nodeId, folderName, []);
          map.set(folderName, tabData);
        }

        tabData.childrenIds.push(node.id);
        return map;
      },
      new Map()
    );

    return Array.from(virtualFolders.values())
      .map(tabData => this.createEntity(tabData));
  }

  private createEntity(tabData: VirtualFolderTabData): TabEntity {
    const mixins: MixinProvider<any>[] = [
      {
        token: VirtualFolderTabData,
        value: tabData,
      },
      VirtualFolderTabMixin,
    ];
    return new TabEntity(VirtualFolderTabModel, mixins);
  }

}
