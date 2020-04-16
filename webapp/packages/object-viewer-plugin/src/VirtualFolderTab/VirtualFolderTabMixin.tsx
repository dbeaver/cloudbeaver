/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { NodesManagerService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';

import { VirtualFolderTabData } from './VirtualFolderTabData';

@injectable()
export class VirtualFolderTabMixin {

  @observable isActivated = false;

  constructor(private virtualFolderTabData: VirtualFolderTabData,
              private nodesManagerService: NodesManagerService) {
  }

  getChildrenId() {
    return this.virtualFolderTabData.childrenIds;
  }

  getTitle(): string {
    return this.virtualFolderTabData.folderName;
  }

  async onActivate() {
    if (this.isActivated) {
      return;
    }

    try {
      for (const nodeId of this.getChildrenId()) {
        await this.nodesManagerService.loadDatabaseObjectInfo(nodeId);
      }
    }
    finally {
      this.isActivated = true;
    }

  }


}
