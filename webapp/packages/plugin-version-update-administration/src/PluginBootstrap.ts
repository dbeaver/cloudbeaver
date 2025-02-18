/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions.js').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate.js').then(m => m.VersionUpdate));

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly versionUpdateService: VersionUpdateService,
    private readonly productInfoService: ProductInfoService,
  ) {
    super();
  }

  override register(): void {
    this.productInfoService.addSubItem({
      key: 'version-update',
      name: 'plugin_version_update_administration_tab_title',
      panel: () => VersionUpdate,
      order: 3,
    });

    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }
}
