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
            title: 'ui_discard_changes',
            message: 'ui_discard_changes_message',
            confirmActionText: 'ui_discard',
            cancelActionText: 'ui_keep_editing',
          });

          if (status === DialogueStateResult.Rejected) {
            return false;
          }
        }

        return true;
      },
      onDeActivate: () => {
        this.settingsAdministrationService.tabsContainer.getDisplayed().forEach(tab => {
          if (tab.options?.source.isEdited()) {
            tab.options?.source.clear();
          }
        });
      },
      getContentComponent: () => SettingsAdministration,
      getDrawerComponent: () => SettingsDrawerItem,
    });
  }
}
