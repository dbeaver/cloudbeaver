/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService, ConfigurationWizardService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import type { IServerConfigurationPageState } from './IServerConfigurationPageState';
import { ServerConfigurationService } from './ServerConfigurationService';

@injectable()
export class ServerConfigurationPageController {
  get state(): IServerConfigurationPageState {
    return this.serverConfigurationService.state;
  }

  get editing(): boolean {
    return !this.administrationScreenService.isConfigurationMode;
  }

  constructor(
    private readonly configurationWizardService: ConfigurationWizardService,
    private readonly serverConfigurationService: ServerConfigurationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly administrationScreenService: AdministrationScreenService
  ) {
  }

  reset = (): void => {
    this.serverConfigurationService.loadConfig();
  };

  change = (): void => {
    this.serverConfigurationService.changed();

    if (!this.state.serverConfig.adminCredentialsSaveEnabled) {
      this.state.serverConfig.publicCredentialsSaveEnabled = false;
    }
  };

  save = async (): Promise<void> => {
    if (this.administrationScreenService.isConfigurationMode) {
      await this.finishConfiguration();
    } else {
      await this.updateConfiguration();
    }
  };

  private async updateConfiguration(): Promise<void> {
    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'administration_server_configuration_save_confirmation_title',
      message: 'administration_server_configuration_save_confirmation_message',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }
    await this.serverConfigurationService.saveConfiguration(true);
  }

  private async finishConfiguration(): Promise<void> {
    await this.configurationWizardService.next();
  }
}
