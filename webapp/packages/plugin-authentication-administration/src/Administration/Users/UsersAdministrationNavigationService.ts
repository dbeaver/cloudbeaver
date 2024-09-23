/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { injectable } from '@cloudbeaver/core-di';

import { ADMINISTRATION_ITEM_USER_CREATE_PARAM } from './ADMINISTRATION_ITEM_USER_CREATE_PARAM.js';

export enum EUsersAdministrationSub {
  Users = 'users',
  Teams = 'teams',
  MetaProperties = 'metaProperties',
}

@injectable()
export class UsersAdministrationNavigationService {
  static ItemName = 'users';

  constructor(private readonly administrationScreenService: AdministrationScreenService) {
    this.navToRoot = this.navToRoot.bind(this);
  }

  navToRoot(): void {
    this.administrationScreenService.navigateToItem(UsersAdministrationNavigationService.ItemName);
  }

  navToCreate(): void {
    this.navToSub(EUsersAdministrationSub.Users, ADMINISTRATION_ITEM_USER_CREATE_PARAM);
  }

  navToSub(sub: EUsersAdministrationSub, param?: string): void {
    this.administrationScreenService.navigateToItemSub(UsersAdministrationNavigationService.ItemName, sub, param);
  }
}
