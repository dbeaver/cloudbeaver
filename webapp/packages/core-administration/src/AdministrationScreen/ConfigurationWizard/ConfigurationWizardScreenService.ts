/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

import { AdministrationScreenService } from '../AdministrationScreenService.js';
import { ConfigurationWizardService } from './ConfigurationWizardService.js';

@injectable()
export class ConfigurationWizardScreenService extends Dependency {
  constructor(
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly screenService: ScreenService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly configurationWizardService: ConfigurationWizardService,
  ) {
    super();
    this.screenService.routeChange.addHandler(this.onRouteChange.bind(this));
  }

  private async onRouteChange() {
    // this is need for this.isConfigurationMode
    await this.serverConfigResource.load();

    if (!this.administrationScreenService.isConfigurationMode) {
      return;
    }

    const isCurrentStepAvailable =
      this.configurationWizardService.currentStep &&
      this.configurationWizardService.isStepAvailable(this.configurationWizardService.currentStep.name);

    if (!isCurrentStepAvailable) {
      this.administrationScreenService.navigateToRoot();
    }
  }
}
