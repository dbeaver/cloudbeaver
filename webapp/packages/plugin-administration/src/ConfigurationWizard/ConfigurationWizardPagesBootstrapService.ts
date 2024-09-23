/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationItemService, AdministrationItemType, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ADMINISTRATION_SERVER_CONFIGURATION_ITEM } from './ServerConfiguration/ADMINISTRATION_SERVER_CONFIGURATION_ITEM.js';
import { ServerConfigurationService } from './ServerConfiguration/ServerConfigurationService.js';

const FinishPage = importLazyComponent(() => import('./Finish/FinishPage.js').then(m => m.FinishPage));
const FinishPageDrawerItem = importLazyComponent(() => import('./Finish/FinishPageDrawerItem.js').then(m => m.FinishPageDrawerItem));
const ServerConfigurationDrawerItem = importLazyComponent(() =>
  import('./ServerConfiguration/ServerConfigurationDrawerItem.js').then(m => m.ServerConfigurationDrawerItem),
);
const ServerConfigurationPage = importLazyComponent(() =>
  import('./ServerConfiguration/ServerConfigurationPage.js').then(m => m.ServerConfigurationPage),
);
const WelcomeDrawerItem = importLazyComponent(() => import('./Welcome/WelcomeDrawerItem.js').then(m => m.WelcomeDrawerItem));
const WelcomePage = importLazyComponent(() => import('./Welcome/WelcomePage.js').then(m => m.WelcomePage));

@injectable()
export class ConfigurationWizardPagesBootstrapService extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly configurationWizardService: ConfigurationWizardService,
    private readonly serverConfigurationService: ServerConfigurationService,
  ) {
    super();
  }

  override register(): void {
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
        onFinish: this.serverConfigurationService.saveConfiguration.bind(this.serverConfigurationService, false),
        onConfigurationFinish: this.serverConfigurationService.saveConfiguration.bind(this.serverConfigurationService, true),
      },
      order: 2,
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
}
