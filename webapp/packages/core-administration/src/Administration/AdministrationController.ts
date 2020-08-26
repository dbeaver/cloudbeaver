/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { AdministrationItemService } from '../AdministrationItem/AdministrationItemService';
import { filterConfigurationWizard } from '../AdministrationItem/filterConfigurationWizard';
import { orderAdministrationItems } from '../AdministrationItem/orderAdministrationItems';

@injectable()
export class AdministrationController {
  getItems(configurationWizard: boolean) {
    return this.administrationItemService
      .items
      .filter(filterConfigurationWizard(configurationWizard))
      .sort(orderAdministrationItems);
  }

  constructor(
    private administrationItemService: AdministrationItemService
  ) {}
}
