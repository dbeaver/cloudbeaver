/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { ADMINISTRATION_SERVER_CONFIGURATION_ITEM } from './ServerConfiguration/ADMINISTRATION_SERVER_CONFIGURATION_ITEM';

@injectable()
export class ServerConfigurationAdministrationNavService {
  constructor(
    private administrationScreenService: AdministrationScreenService
  ) { }

  navToSettings(): void {
    this.administrationScreenService.navigateToItem(ADMINISTRATION_SERVER_CONFIGURATION_ITEM);
  }
}
