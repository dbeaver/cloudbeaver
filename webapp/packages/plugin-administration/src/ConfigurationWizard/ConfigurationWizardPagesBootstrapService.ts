/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

import { FinishPage } from './Finish/FinishPage';
import { FinishPageDrawerItem } from './Finish/FinishPageDrawerItem';
import { ADMINISTRATION_SERVER_CONFIGURATION_ITEM } from './ServerConfiguration/ADMINISTRATION_SERVER_CONFIGURATION_ITEM';
import { ServerConfigurationDrawerItem } from './ServerConfiguration/ServerConfigurationDrawerItem';
import { ServerConfigurationPage } from './ServerConfiguration/ServerConfigurationPage';
import { ServerConfigurationService } from './ServerConfiguration/ServerConfigurationService';
import { WelcomeDrawerItem } from './Welcome/WelcomeDrawerItem';
import { WelcomePage } from './Welcome/WelcomePage';

@injectable()
export class ConfigurationWizardPagesBootstrapService extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly configurationWizardService: ConfigurationWizardService,
    private readonly serverConfigurationService: ServerConfigurationService
  ) {
    super();
  }

  register(): void | Promise<void> {
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
        onLoad: this.serverConfigurationService.loadConfig.bind(this.serverConfigurationService),
        isDone: this.serverConfigurationService.isDone.bind(this.serverConfigurationService),
        onFinish: this.serverConfigurationService.saveConfiguration.bind(
          this.serverConfigurationService,
          false
        ),
        onConfigurationFinish: this.serverConfigurationService.saveConfiguration.bind(
          this.serverConfigurationService,
          true
        ),
      },
      order: 4,
      onActivate: () => this.serverConfigurationService.activate(),
      onDeActivate: this.serverConfigurationService.deactivate.bind(this.serverConfigurationService),
      onLoad: this.serverConfigurationService.loadConfig.bind(this.serverConfigurationService, false),
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

  load(): void | Promise<void> { }
}
