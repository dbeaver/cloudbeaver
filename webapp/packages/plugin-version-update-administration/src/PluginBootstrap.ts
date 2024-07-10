/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { ProductInfoNavigationService } from '@cloudbeaver/plugin-product-information';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate').then(m => m.VersionUpdate));

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly versionUpdateService: VersionUpdateService,
    private readonly productInfoNavigationService: ProductInfoNavigationService,
  ) {
    super();
  }

  register(): void {
    this.productInfoNavigationService.addToSub({
      name: 'version-update',
      getComponent: () => VersionUpdate,
      title: 'Version Update',
    });

    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }
}
