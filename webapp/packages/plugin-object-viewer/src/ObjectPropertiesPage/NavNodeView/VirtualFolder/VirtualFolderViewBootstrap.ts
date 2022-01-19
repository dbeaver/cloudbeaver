/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeInfoResource, NavNodeViewService } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { VirtualFolderPanel } from './VirtualFolderPanel';
import { VirtualFolderTab } from './VirtualFolderTab';
import { VirtualFolderUtils } from './VirtualFolderUtils';

@injectable()
export class VirtualFolderViewBootstrap extends Bootstrap {
  constructor(
    private readonly navNodeViewService: NavNodeViewService,
    private readonly navNodeInfoResource: NavNodeInfoResource
  ) {
    super();
  }

  register(): void {
    this.navNodeViewService.addTransform({
      order: 2,
      tab: (nodeId, folderId) => {
        if (VirtualFolderUtils.isVirtualFolder(folderId)) {
          return VirtualFolderTab;
        }
        return undefined;
      },
      panel: (nodeId, folderId) => {
        if (VirtualFolderUtils.isVirtualFolder(folderId)) {
          return VirtualFolderPanel;
        }
        return undefined;
      },
      transformer: (nodeId, children) => {
        if (!children) {
          return children;
        }

        const virtualFolders: string[] = [];
        const nextChildren: string[] = [];

        for (const child of children) {
          const node = this.navNodeInfoResource.get(child);

          if (!node || node?.folder) {
            nextChildren.push(child);
          } else if (node?.nodeType) {
            const virtualId = VirtualFolderUtils.getFolderId(node.nodeType);

            if (!virtualFolders.includes(virtualId)) {
              virtualFolders.push(virtualId);
            }
          }
        }

        nextChildren.push(...virtualFolders);

        return nextChildren;
      },
    });
  }

  load(): void { }
}
