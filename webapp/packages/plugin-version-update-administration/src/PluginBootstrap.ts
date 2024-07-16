/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { VersionResource } from '@cloudbeaver/core-version';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate').then(m => m.VersionUpdate));

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly versionUpdateService: VersionUpdateService,
    private readonly versionResource: VersionResource,
    private readonly productInfoService: ProductInfoService,
  ) {
    super();
  }

  register(): void {
    this.productInfoService.tabsContainer.add({
      key: 'version-update',
      name: 'version-update',
      panel: () => VersionUpdate,
      title: 'plugin_version_update_administration_tab_title',
      order: 2,
    });

    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }

  async load(): Promise<void> {
    await this.versionResource.load();
  }
}
