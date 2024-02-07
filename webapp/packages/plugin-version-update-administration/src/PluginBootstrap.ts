/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate').then(m => m.VersionUpdate));
const VersionUpdateDrawerItem = importLazyComponent(() => import('./VersionUpdateDrawerItem').then(m => m.VersionUpdateDrawerItem));

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly administrationItemService: AdministrationItemService, private readonly versionUpdateService: VersionUpdateService) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: 'version-update',
      type: AdministrationItemType.Administration,
      getContentComponent: () => VersionUpdate,
      getDrawerComponent: () => VersionUpdateDrawerItem,
    });

    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }
}
