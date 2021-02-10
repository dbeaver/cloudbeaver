/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';

import { VirtualFolderTabData } from './VirtualFolderTabData';

@injectable()
export class VirtualFolderTabMixin {
  isActivated = false;

  constructor(
    private virtualFolderTabData: VirtualFolderTabData,
  ) {
    makeObservable(this, {
      isActivated: observable,
    });
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
      // for (const nodeId of this.getChildrenId()) {
      //   await this.dbObjectService.load(nodeId);
      // }
    } finally {
      this.isActivated = true;
    }
  }
}
