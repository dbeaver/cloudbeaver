/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationItemType } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { AdministrationLicensePageService } from './AdministrationLicensePageService';
import { LicenseDrawerItem } from './LicenseDrawerItem';
import { LicensePage } from './LicensePage';

@injectable()
export class AdministrationLicensePageBootstrapService extends Bootstrap {
  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly administrationLicensePageService: AdministrationLicensePageService
  ) {
    super();
  }

  register(): void {
    this.administrationItemService.create({
      name: 'license',
      type: AdministrationItemType.Default,
      configurationWizardOptions: {
        description: 'administration_configuration_wizard_license_step_description',
        order: 1.2,
        isDone: this.administrationLicensePageService.isDone.bind(this.administrationLicensePageService),
        onFinish: this.administrationLicensePageService.save.bind(this.administrationLicensePageService),
      },
      order: 5,
      onActivate: this.administrationLicensePageService.loadConfig.bind(this.administrationLicensePageService),
      getContentComponent: () => LicensePage,
      getDrawerComponent: () => LicenseDrawerItem,
    });
  }

  load(): void { }
}
