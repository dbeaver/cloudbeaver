/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { SettingsLocalizationService } from '@cloudbeaver/core-settings-localization';
import { formValidationContext } from '@cloudbeaver/core-ui';
import {
  getServerConfigurationFormPart,
  ServerConfigurationFormService,
  ServerConfigurationFormStateManager,
} from '@cloudbeaver/plugin-administration';

import { ConfigurationSettingsService } from './ConfigurationSettingsService.js';

const ConfigurationSettingsPage = importLazyComponent(() => import('./ConfigurationSettingsPage.js').then(m => m.ConfigurationSettingsPage));
const ConfigurationSettingsDrawerItem = importLazyComponent(() =>
  import('./ConfigurationSettingsDrawerItem.js').then(m => m.ConfigurationSettingsDrawerItem),
);

@injectable(() => [
  AdministrationItemService,
  ServerConfigurationFormService,
  ServerConfigurationFormStateManager,
  ConfigurationSettingsService,
  ServerConfigResource,
  LocalizationService,
  SettingsLocalizationService,
])
export class ConfigurationSettingsBootstrap extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
    private readonly serverConfigurationFormStateManager: ServerConfigurationFormStateManager,
    private readonly configurationSettingsService: ConfigurationSettingsService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly localizationService: LocalizationService,
    private readonly settingsLocalizationService: SettingsLocalizationService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationFormService.onPrepare.addHandler(form => {
      if (this.serverConfigResource.configurationMode) {
        getServerConfigurationFormPart(form).state.serverConfig.productSettings = this.configurationSettingsService.getChanges();
      }
    });

    this.serverConfigurationFormService.onValidate.addHandler((_, contexts) => {
      if (this.serverConfigResource.configurationMode) {
        const error = this.configurationSettingsService.validate();

        if (error) {
          contexts.getContext(formValidationContext).error(error);
        }
      }
    });

    this.administrationItemService.create({
      name: 'default-preferences',
      type: AdministrationItemType.ConfigurationWizard,
      order: 2,
      configurationWizardOptions: {
        description: 'plugin_settings_default_administration_configuration_description',
        onFinish: async () => {
          const form = this.serverConfigurationFormStateManager.formState;

          if (!form) {
            return false;
          }

          const contexts = await form.validationTask.execute(form);

          return contexts.getContext(formValidationContext).valid;
        },
        onConfigurationFinish: () => {
          const language = this.settingsLocalizationService.language;
          this.localizationService.setLanguage(language);
          document.documentElement.lang = this.localizationService.currentLanguage;
          this.configurationSettingsService.clear();
        },
      },
      getContentComponent: () => ConfigurationSettingsPage,
      getDrawerComponent: () => ConfigurationSettingsDrawerItem,
    });
  }
}
