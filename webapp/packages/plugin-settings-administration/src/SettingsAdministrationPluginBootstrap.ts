/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { confirmUnsavedChanges, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IEditableSettingsSource } from '@cloudbeaver/core-settings';

import { SettingsAdministrationService } from './SettingsAdministrationService.js';

const SettingsAdministration = importLazyComponent(() => import('./SettingsAdministration.js').then(module => module.SettingsAdministration));
const SettingsDrawerItem = importLazyComponent(() => import('./SettingsDrawerItem.js').then(module => module.SettingsDrawerItem));

@injectable(() => [AdministrationItemService, SettingsAdministrationService, CommonDialogService, NotificationService])
export class SettingsAdministrationPluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly settingsAdministrationService: SettingsAdministrationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.administrationItemService.create({
      name: 'settings',
      type: AdministrationItemType.Administration,
      order: 3,
      canDeActivate: this.confirmUnsavedSettings.bind(this),
      getContentComponent: () => SettingsAdministration,
      getDrawerComponent: () => SettingsDrawerItem,
    });
  }

  private confirmUnsavedSettings() {
    const edited = this.settingsAdministrationService.tabsContainer.tabInfoList
      .map(info => info.options?.source)
      .filter((source): source is IEditableSettingsSource => source?.isEdited() === true);

    if (edited.length === 0) {
      return true;
    }

    return confirmUnsavedChanges(this.commonDialogService, {
      get isChanged() {
        return edited.some(source => source.isEdited());
      },
      save: async () => {
        try {
          for (const source of edited) {
            await source.save();
          }
          this.notificationService.logSuccess({ title: 'plugin_settings_administration_settings_save_success' });
          return true;
        } catch (exception: any) {
          this.notificationService.logException(exception, 'plugin_settings_administration_settings_save_fail');
          return false;
        }
      },
      reset: () => {
        for (const source of edited) {
          source.clear();
        }
      },
    });
  }
}
