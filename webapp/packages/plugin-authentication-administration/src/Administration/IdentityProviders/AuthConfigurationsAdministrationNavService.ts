/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class AuthConfigurationsAdministrationNavService {
  constructor(
    private administrationScreenService: AdministrationScreenService
  ) { }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem('auth-configurations');
  }

  navToCreate(): void {
    this.administrationScreenService.navigateToItemSub('auth-configurations', 'create');
  }
}
