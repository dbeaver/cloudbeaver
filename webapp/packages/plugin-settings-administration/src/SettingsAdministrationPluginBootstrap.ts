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

const SettingsAdministration = importLazyComponent(() => import('./SettingsAdministration.js').then(module => module.SettingsAdministration));
const SettingsDrawerItem = importLazyComponent(() => import('./SettingsDrawerItem.js').then(module => module.SettingsDrawerItem));

@injectable()
export class SettingsAdministrationPluginBootstrap extends Bootstrap {
  constructor(private readonly administrationItemService: AdministrationItemService) {
    super();
  }

  override register(): void | Promise<void> {
    this.administrationItemService.create({
      name: 'settings',
      type: AdministrationItemType.Administration,
      order: 3,
      getContentComponent: () => SettingsAdministration,
      getDrawerComponent: () => SettingsDrawerItem,
    });
  }
}
