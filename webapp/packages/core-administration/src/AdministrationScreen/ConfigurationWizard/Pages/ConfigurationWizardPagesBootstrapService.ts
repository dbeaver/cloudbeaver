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
import { IWelcomePageState } from './Welcome/IWelcomePageState';
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
        isDone: this.isWelcomeDone.bind(this),
        onConfigurationFinish: this.saveConfig.bind(this),
      },
      order: 1,
      getContentComponent: () => WelcomePage,
      getDrawerComponent: () => WelcomeDrawerItem,
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

  private isWelcomeDone() {
    const state = this.administrationScreenService.getItemState<IWelcomePageState>('welcome');

    return !!(state?.serverConfig.serverName && state.serverConfig.adminName && state.serverConfig.adminPassword);
  }

  private async saveConfig() {
    const state = this.administrationScreenService.getItemState<IWelcomePageState>('welcome');

    if (!state) {
      return;
    }

    try {
      await this.graphQLService.gql.configureServer({ configuration: state.serverConfig });
      await this.graphQLService.gql.setDefaultNavigatorSettings({ settings: state.navigatorConfig });
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t save server configuration');

      throw exception;
    }
  }
}
