/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { AdministrationItemService } from '../../../AdministrationItem/AdministrationItemService';
import { AdministrationItemType } from '../../../AdministrationItem/IAdministrationItem';
import { AdministrationScreenService } from '../../AdministrationScreenService';
import { ConfigurationWizardService } from '../ConfigurationWizardService';
import { FinishPage } from './Finish/FinishPage';
import { FinishPageDrawerItem } from './Finish/FinishPageDrawerItem';
import { IServerConfigurationPageState } from './ServerConfiguration/IServerConfigurationPageState';
import { ServerConfigurationDrawerItem } from './ServerConfiguration/ServerConfigurationDrawerItem';
import { ServerConfigurationPage } from './ServerConfiguration/ServerConfigurationPage';
import { WelcomeDrawerItem } from './Welcome/WelcomeDrawerItem';
import { WelcomePage } from './Welcome/WelcomePage';

@injectable()
export class ConfigurationWizardPagesBootstrapService extends Bootstrap {
  constructor(
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private configurationWizardService: ConfigurationWizardService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
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
      name: 'configuration',
      type: AdministrationItemType.ConfigurationWizard,
      configurationWizardOptions: {
        description: 'administration_configuration_wizard_configuration_step_description',
        isDone: this.isConfigurationDone.bind(this),
        onConfigurationFinish: this.saveConfig.bind(this),
      },
      order: 1.1,
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

  private isConfigurationDone() {
    const state = this.administrationScreenService.getItemState<IServerConfigurationPageState>('welcome');

    return !!(state?.serverConfig.serverName && state.serverConfig.adminName && state.serverConfig.adminPassword);
  }

  private async saveConfig() {
    const state = this.administrationScreenService.getItemState<IServerConfigurationPageState>('welcome');

    if (!state) {
      throw new Error('No state available');
    }

    try {
      await this.graphQLService.gql.setDefaultNavigatorSettings({ settings: state.navigatorConfig });
      await this.graphQLService.gql.configureServer({ configuration: state.serverConfig });
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t save server configuration');

      throw exception;
    }
  }
}
