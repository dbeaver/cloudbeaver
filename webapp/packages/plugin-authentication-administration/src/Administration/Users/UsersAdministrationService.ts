/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService } from '@cloudbeaver/core-administration';
import { AdminUser, RolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { CreateRoleService } from './Roles/CreateRoleService';
import { UsersAdministration } from './UsersAdministration';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService';
import { UsersDrawerItem } from './UsersDrawerItem';
import { CreateUserService } from './UsersTable/CreateUserService';
import { Origin } from './UsersTable/UserDetailsInfo/Origin';

export interface IUserDetailsInfoProps {
  user: AdminUser;
}

@injectable()
export class UsersAdministrationService extends Bootstrap {
  readonly userDetailsInfoPlaceholder = new PlaceholderContainer<IUserDetailsInfoProps>();

  constructor(
    private administrationItemService: AdministrationItemService,
    private notificationService: NotificationService,
    private usersResource: UsersResource,
    private createUserService: CreateUserService,
    private readonly rolesResource: RolesResource,
    private readonly createRoleService: CreateRoleService,
  ) {
    super();
  }

  register() {
    this.administrationItemService.create({
      name: UsersAdministrationNavigationService.ItemName,
      order: 3,
      sub: [
        {
          name: EUsersAdministrationSub.MetaProperties,
        },
        {
          name: EUsersAdministrationSub.Users,
          onDeActivate: this.cancelCreate.bind(this),
        },
        {
          name: EUsersAdministrationSub.Roles,
          onActivate: this.loadRoles.bind(this),
          onDeActivate: (configurationWizard, outside) => {
            if (outside) {
              this.rolesResource.cleanNewFlags();
            }
          },
        },
      ],
      getContentComponent: () => UsersAdministration,
      getDrawerComponent: () => UsersDrawerItem,
      onActivate: this.loadUsers.bind(this),
    });
    this.userDetailsInfoPlaceholder.add(Origin, 0);
  }

  load(): void | Promise<void> { }

  private async cancelCreate(param: string | null) {
    if (param === 'create') {
      this.createUserService.close();
    }
  }

  private async loadUsers() {
    try {
      await this.usersResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while loading users');
    }
  }

  private async loadRoles(param: string | null) {
    if (param === 'create') {
      this.createRoleService.fillData();
    }
    try {
      await this.rolesResource.loadAll();
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while loading roles');
    }
  }
}
