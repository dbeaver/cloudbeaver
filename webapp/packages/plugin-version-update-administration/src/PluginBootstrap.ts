/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { VersionUpdate } from './VersionUpdate';
import { VersionUpdateDrawerItem } from './VersionUpdateDrawerItem';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService
  ) {
    super();
  }

  async load(): Promise<void> { }

  register(): void {
    this.administrationItemService.create({
      name: 'version-update',
      type: AdministrationItemType.Administration,
      order: 5,
      getContentComponent: () => VersionUpdate,
      getDrawerComponent: () => VersionUpdateDrawerItem,
    });
  }
}
