/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ITab } from '@cloudbeaver/core-blocks';
import { Entity, injectable } from '@cloudbeaver/core-di';

import { VirtualFolderTab } from './VirtualFolderTab';
import { VirtualFolderTabMixin } from './VirtualFolderTabMixin';

@injectable()
export class VirtualFolderTabModel implements ITab {
  readonly tabId: string;
  title: string;
  icon = 'platform:/plugin/org.jkiss.dbeaver.model/icons/tree/folder.png';

  panel = VirtualFolderTab;

  onActivate = () => this.virtualFolderTabMixin.onActivate();

  constructor(private tabEntity: Entity,
              private virtualFolderTabMixin: VirtualFolderTabMixin) {
    this.tabId = this.tabEntity.id;
    this.title = this.virtualFolderTabMixin.getTitle();
  }
}
