/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import { EUsersAdministrationSub, UsersAdministrationNavigationService } from '../UsersAdministrationNavigationService.js';

@injectable()
export class TeamsAdministrationNavService {
  constructor(private readonly usersAdministrationNavigationService: UsersAdministrationNavigationService) {}

  navToRoot(): void {
    this.usersAdministrationNavigationService.navToSub(EUsersAdministrationSub.Teams);
  }

  navToCreate(): void {
    this.usersAdministrationNavigationService.navToSub(EUsersAdministrationSub.Teams, 'create');
  }
}
