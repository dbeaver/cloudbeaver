/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService, AdministrationScreenService } from '@dbeaver/administration';
import { injectable, Bootstrap } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { UsersManagerService } from '../UsersManagerService';
import { CreateUser } from './CreateUser/CreateUser';
import { UsersAdministration } from './UsersAdministration';
import { UsersDrawerItem } from './UsersDrawerItem';

@injectable()
export class UsersAdministrationService extends Bootstrap {
  constructor(
    private administrationItemService: AdministrationItemService,
    private administrationScreenService: AdministrationScreenService,
    private notificationService: NotificationService,
    private usersManagerService: UsersManagerService,
  ) {
    super();
  }

  bootstrap() {
    this.administrationItemService.create({
      name: 'users',
      sub: [
        {
          name: 'create',
          getComponent: () => CreateUser,
        },
        {
          name: 'edit',
          getComponent: () => UsersAdministration,
        },
      ],
      getContentComponent: () => UsersAdministration,
      getDrawerComponent: () => UsersDrawerItem,
      onActivate: this.loadUsers.bind(this),
    });
  }

  navToRoot() {
    this.administrationScreenService.navigateToItem('users');
  }

  navToCreate() {
    this.administrationScreenService.navigateToItemSub('users', 'create');
  }

  navToEdit(userId: string) {
    this.administrationScreenService.navigateToItemSub('users', 'edit', userId);
  }

  private async loadUsers() {
    try {
      await this.usersManagerService.users.load();
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while loading users');
    }
  }
}
