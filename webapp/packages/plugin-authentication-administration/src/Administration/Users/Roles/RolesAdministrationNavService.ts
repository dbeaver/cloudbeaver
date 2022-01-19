/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { EUsersAdministrationSub, UsersAdministrationNavigationService } from '../UsersAdministrationNavigationService';

@injectable()
export class RolesAdministrationNavService {
  constructor(
    private usersAdministrationNavigationService: UsersAdministrationNavigationService
  ) { }

  navToRoot(): void {
    this.usersAdministrationNavigationService.navToSub(EUsersAdministrationSub.Roles);
  }

  navToCreate(): void {
    this.usersAdministrationNavigationService.navToSub(EUsersAdministrationSub.Roles, 'create');
  }
}
