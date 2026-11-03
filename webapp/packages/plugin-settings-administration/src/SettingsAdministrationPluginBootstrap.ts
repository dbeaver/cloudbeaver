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
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource, ServerSettingsService } from '@cloudbeaver/core-root';
import { SettingsLocalizationService } from '@cloudbeaver/core-settings-localization';
import { formValidationContext } from '@cloudbeaver/core-ui';
import {
  getServerConfigurationFormPart,
  ServerConfigurationFormService,
  ServerConfigurationFormStateManager,
} from '@cloudbeaver/plugin-administration';

import { SettingsAdministrationService } from './SettingsAdministrationService.js';

const SettingsAdministration = importLazyComponent(() => import('./SettingsAdministration.js').then(module => module.SettingsAdministration));
const SettingsDrawerItem = importLazyComponent(() => import('./SettingsDrawerItem.js').then(module => module.SettingsDrawerItem));

@injectable(() => [
  AdministrationItemService,
  SettingsAdministrationService,
  CommonDialogService,
  ServerConfigurationFormService,
  ServerConfigurationFormStateManager,
  ServerSettingsService,
  ServerConfigResource,
  LocalizationService,
  SettingsLocalizationService,
])
export class SettingsAdministrationPluginBootstrap extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly settingsAdministrationService: SettingsAdministrationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
    private readonly serverConfigurationFormStateManager: ServerConfigurationFormStateManager,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly localizationService: LocalizationService,
    private readonly settingsLocalizationService: SettingsLocalizationService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.serverConfigurationFormService.onPrepare.addHandler(form => {
      if (this.serverConfigResource.configurationMode) {
        getServerConfigurationFormPart(form).state.serverConfig.productSettings = this.serverSettingsService.getChanges();
      }
    });

    this.serverConfigurationFormService.onValidate.addHandler((_, contexts) => {
      if (this.serverConfigResource.configurationMode) {
        const error = this.serverSettingsService.validate();

        if (error) {
          contexts.getContext(formValidationContext).error(error);
        }
      }
    });

    this.administrationItemService.create({
      name: 'settings',
      type: AdministrationItemType.Default,
      order: 3,
      configurationWizardOptions: {
        order: 2,
        description: 'plugin_settings_administration_configuration_description',
        onFinish: async () => {
          const form = this.serverConfigurationFormStateManager.formState;

          if (!form) {
            return false;
          }

          const contexts = await form.validationTask.execute(form);

          return contexts.getContext(formValidationContext).valid;
        },
        onConfigurationFinish: () => {
          this.localizationService.setLanguage(this.settingsLocalizationService.language);
        },
      },
      canDeActivate: async configurationWizard => {
        if (configurationWizard) {
          return true;
        }

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
      onDeActivate: configurationWizard => {
        if (configurationWizard) {
          return;
        }

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
