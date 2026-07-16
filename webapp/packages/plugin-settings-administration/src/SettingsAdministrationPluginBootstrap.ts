/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IEditableSettingsSource } from '@cloudbeaver/core-settings';

import { SettingsAdministrationService } from './SettingsAdministrationService.js';

const SettingsAdministration = importLazyComponent(() => import('./SettingsAdministration.js').then(module => module.SettingsAdministration));
const SettingsDrawerItem = importLazyComponent(() => import('./SettingsDrawerItem.js').then(module => module.SettingsDrawerItem));

@injectable(() => [AdministrationItemService, SettingsAdministrationService, CommonDialogService])
export class SettingsAdministrationPluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly settingsAdministrationService: SettingsAdministrationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.administrationItemService.create({
      name: 'settings',
      type: AdministrationItemType.Administration,
      order: 3,
      canDeActivate: async () => {
        const displayed = this.settingsAdministrationService.tabsContainer.getDisplayed();
        const edited = displayed.some(tab => (tab.options?.source as IEditableSettingsSource).isEdited());

        if (edited) {
          const { status } = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'ui_save_reminder',
            message: 'ui_are_you_sure',
          });

          if (status === DialogueStateResult.Rejected) {
            return false;
          }
        }

        return true;
      },
      getContentComponent: () => SettingsAdministration,
      getDrawerComponent: () => SettingsDrawerItem,
    });
  }
}
