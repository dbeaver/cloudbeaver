/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { EAdminPermission, PermissionsService } from '@cloudbeaver/core-root';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { AdministrationTopAppBarService } from '@cloudbeaver/plugin-administration';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions.js').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate.js').then(m => m.VersionUpdate));
const VersionUpdateTab = importLazyComponent(() => import('./VersionUpdateTab.js').then(m => m.VersionUpdateTab));
const HotfixBanner = importLazyComponent(() => import('./HotfixBanner.js').then(m => m.HotfixBanner));

@injectable(() => [VersionUpdateService, ProductInfoService, AdministrationTopAppBarService, PermissionsService])
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly versionUpdateService: VersionUpdateService,
    private readonly productInfoService: ProductInfoService,
    private readonly administrationTopAppBarService: AdministrationTopAppBarService,
    private readonly permissionsService: PermissionsService,
  ) {
    super();
  }

  override register(): void {
    this.productInfoService.addSubItem({
      key: 'version-update',
      name: 'plugin_version_update_administration_tab_title',
      panel: () => VersionUpdate,
      tab: () => VersionUpdateTab,
      order: 3,
    });

    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }

  override load(): void {
    // Append after the navigation contributions have been registered.
    this.administrationTopAppBarService.navBarPlaceholder.add(HotfixBanner, undefined, () => !this.permissionsService.has(EAdminPermission.admin));
  }
}
