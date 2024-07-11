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
import { ProductInfoNavigationService } from '@cloudbeaver/plugin-product-information';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate').then(m => m.VersionUpdate));

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly versionUpdateService: VersionUpdateService,
    private readonly productInfoNavigationService: ProductInfoNavigationService,
    private readonly versionResource: VersionResource,
  ) {
    super();
  }

  private versionDataUpdateHandler() {
    this.productInfoNavigationService.updateSub('version-update', {
      highlighted: this.versionUpdateService.newVersionAvailable,
      tooltip: this.versionUpdateService.newVersionAvailable ? 'version_update_new_version_available' : undefined,
    });

    this.productInfoNavigationService.updateItem({
      highlighted: this.versionUpdateService.newVersionAvailable,
    });
  }

  register(): void {
    this.productInfoNavigationService.addToSub({
      name: 'version-update',
      getComponent: () => VersionUpdate,
      title: 'plugin_version_update_administration_tab_title',
    });

    this.versionResource.onDataUpdate.addHandler(this.versionDataUpdateHandler.bind(this));
    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }

  async load(): Promise<void> {
    await this.versionResource.load();
  }
}
