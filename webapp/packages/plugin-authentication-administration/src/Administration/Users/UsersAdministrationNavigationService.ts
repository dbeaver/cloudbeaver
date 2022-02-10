/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

export enum EUsersAdministrationSub {
  Users = 'users',
  Roles = 'roles',
  MetaProperties = 'metaProperties'
}

@injectable()
export class UsersAdministrationNavigationService {
  static ItemName = 'users';

  constructor(
    private readonly administrationScreenService: AdministrationScreenService
  ) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(UsersAdministrationNavigationService.ItemName);
  }

  navToCreate(): void {
    this.navToSub(EUsersAdministrationSub.Users, 'create');
  }

  navToSub(sub: EUsersAdministrationSub, param?: string): void {
    this.administrationScreenService.navigateToItemSub(
      UsersAdministrationNavigationService.ItemName,
      sub,
      param
    );
  }
}
