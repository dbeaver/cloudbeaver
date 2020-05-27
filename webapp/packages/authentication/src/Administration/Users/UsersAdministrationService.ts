/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService } from '@dbeaver/administration';
import { injectable, Bootstrap } from '@dbeaver/core/di';

import { UsersManagerService } from '../UsersManagerService';
import { UsersAdministration } from './UsersAdministration';
import { UsersDrawerItem } from './UsersDrawerItem';

@injectable()
export class UsersAdministrationService extends Bootstrap {
  constructor(
    private administrationItemService: AdministrationItemService,
    private usersManagerService: UsersManagerService,
  ) {
    super();
  }

  bootstrap() {
    this.administrationItemService.create({
      name: 'users',
      getContentComponent: () => UsersAdministration,
      getDrawerComponent: () => UsersDrawerItem,
      onActivate: this.loadUsers.bind(this),
    });
  }

  private async loadUsers() {
    await this.usersManagerService.users.load();
  }
}
