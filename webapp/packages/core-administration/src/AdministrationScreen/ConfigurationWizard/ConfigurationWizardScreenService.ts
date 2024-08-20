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
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { AdministrationScreenService } from '../AdministrationScreenService';
import { ConfigurationWizardService } from './ConfigurationWizardService';

@injectable()
export class ConfigurationWizardScreenService extends Dependency {
  constructor(
    private administrationScreenService: AdministrationScreenService,
    private screenService: ScreenService,
    private serverConfigResource: ServerConfigResource,
    private readonly configurationWizardService: ConfigurationWizardService,
  ) {
    super();
    this.screenService.routeChange.addHandler(this.onRouteChange.bind(this));
  }

  private async onRouteChange() {
    await this.serverConfigResource.load();

    if (!this.serverConfigResource.data?.configurationMode) {
      return;
    }

    const isExistingPage =
      isNotNullDefined(this.administrationScreenService?.activeScreen?.item) &&
      this.configurationWizardService.isStepAvailable(this.administrationScreenService.activeScreen.item);
    const isCurrentStepAvailable =
      isNotNullDefined(this.configurationWizardService.currentStep) &&
      this.configurationWizardService.isStepAvailable(this.configurationWizardService.currentStep.name);

    if (!isExistingPage || !isCurrentStepAvailable) {
      this.administrationScreenService.navigateToRoot();
    }
  }
}
