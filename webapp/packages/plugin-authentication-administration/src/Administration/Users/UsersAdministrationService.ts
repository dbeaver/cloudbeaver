/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdministrationItemService } from '@cloudbeaver/core-administration';
import { AdminUser, RolesResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, Bootstrap } from '@cloudbeaver/core-di';

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
    private readonly administrationItemService: AdministrationItemService,
    private readonly createUserService: CreateUserService,
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
      defaultSub: EUsersAdministrationSub.Users,
      getContentComponent: () => UsersAdministration,
      getDrawerComponent: () => UsersDrawerItem,
    });
    this.userDetailsInfoPlaceholder.add(Origin, 0);
  }

  load(): void | Promise<void> { }

  private async cancelCreate(param: string | null) {
    if (param === 'create') {
      this.createUserService.close();
    }
  }

  private async loadRoles(param: string | null) {
    if (param === 'create') {
      this.createRoleService.fillData();
    }
  }
}
