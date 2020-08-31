/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

@injectable()
export class UsersAdministrationNavigationService {
  static ItemName = 'users'
  static AddItemName = 'add'

  constructor(
    private administrationScreenService: AdministrationScreenService,
  ) {}

  navToRoot() {
    this.administrationScreenService.navigateToItem(UsersAdministrationNavigationService.ItemName);
  }

  navToAdd() {
    this.administrationScreenService.navigateToItemSub(
      UsersAdministrationNavigationService.ItemName,
      UsersAdministrationNavigationService.AddItemName
    );
  }
}
