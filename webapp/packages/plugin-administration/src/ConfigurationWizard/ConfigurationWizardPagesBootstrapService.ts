/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationItemType, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { formValidationContext } from '@cloudbeaver/core-ui';

import { ADMINISTRATION_SERVER_CONFIGURATION_ITEM } from './ServerConfiguration/ADMINISTRATION_SERVER_CONFIGURATION_ITEM';
import { ServerConfigurationFormStateManager } from './ServerConfiguration/ServerConfigurationFormStateManager';
import { ServerConfigurationService } from './ServerConfiguration/ServerConfigurationService';

const FinishPage = importLazyComponent(() => import('./Finish/FinishPage').then(m => m.FinishPage));
const FinishPageDrawerItem = importLazyComponent(() => import('./Finish/FinishPageDrawerItem').then(m => m.FinishPageDrawerItem));
const ServerConfigurationDrawerItem = importLazyComponent(() =>
  import('./ServerConfiguration/ServerConfigurationDrawerItem').then(m => m.ServerConfigurationDrawerItem),
);
const ServerConfigurationPage = importLazyComponent(() =>
  import('./ServerConfiguration/ServerConfigurationPage').then(m => m.ServerConfigurationPage),
);
const WelcomeDrawerItem = importLazyComponent(() => import('./Welcome/WelcomeDrawerItem').then(m => m.WelcomeDrawerItem));
const WelcomePage = importLazyComponent(() => import('./Welcome/WelcomePage').then(m => m.WelcomePage));

@injectable()
export class ConfigurationWizardPagesBootstrapService extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly configurationWizardService: ConfigurationWizardService,
    private readonly serverConfigurationFormStateManager: ServerConfigurationFormStateManager,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly sessionDataResource: SessionDataResource,
  ) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: 'welcome',
      type: AdministrationItemType.ConfigurationWizard,
      configurationWizardOptions: {
        description: 'administration_configuration_wizard_welcome_step_description',
      },
      order: 1,
      getContentComponent: () => WelcomePage,
      getDrawerComponent: () => WelcomeDrawerItem,
    });
    this.administrationItemService.create({
      name: ADMINISTRATION_SERVER_CONFIGURATION_ITEM,
      type: AdministrationItemType.Default,
      configurationWizardOptions: {
        description: 'administration_configuration_wizard_configuration_step_description',
        order: 1.5,
        isDone: () => this.serverConfigurationService.isDone,
        onFinish: async () => {
          const state = this.serverConfigurationFormStateManager.formState;

          if (state) {
            const contexts = await state.validationTask.execute(state);
            const validation = contexts.getContext(formValidationContext);

            return validation.valid;
          }

          return true;
        },
        onConfigurationFinish: async () => {
          await this.serverConfigurationFormStateManager.formState?.save();
          await this.sessionDataResource.refresh();
        },
        onLoad: () => {
          this.serverConfigurationFormStateManager.create();
        },
      },
      order: 2,
      onLoad: () => {
        this.serverConfigurationFormStateManager.create();
      },
      canDeActivate: async configurationWizard => {
        const state = this.serverConfigurationFormStateManager.formState;

        if (state?.isSaving) {
          return false;
        }

        if (!configurationWizard && state?.isChanged) {
          const result = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'ui_save_reminder',
            message: 'ui_are_you_sure',
          });

          if (result === DialogueStateResult.Rejected) {
            return false;
          }
        }

        return true;
      },
      getContentComponent: () => ServerConfigurationPage,
      getDrawerComponent: () => ServerConfigurationDrawerItem,
    });
    this.administrationItemService.create({
      name: 'finish',
      type: AdministrationItemType.ConfigurationWizard,
      configurationWizardOptions: {
        description: 'administration_configuration_wizard_finish_step_description',
        isDisabled: () => !this.configurationWizardService.canFinish,
      },
      canActivate: () => this.configurationWizardService.canFinish,
      getContentComponent: () => FinishPage,
      getDrawerComponent: () => FinishPageDrawerItem,
    });
  }
}
