/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { AdministrationItemService } from '@cloudbeaver/core-administration';
import { type AdminUser, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { CreateTeamService } from './Teams/TeamsTable/CreateTeamService.js';
import { EUsersAdministrationSub, UsersAdministrationNavigationService } from './UsersAdministrationNavigationService.js';
import { CreateUserService } from './UsersTable/CreateUserService.js';

const UserCredentialsList = React.lazy(async () => {
  const { UserCredentialsList } = await import('./UsersTable/UserCredentialsList.js');
  return { default: UserCredentialsList };
});

const UsersDrawerItem = React.lazy(async () => {
  const { UsersDrawerItem } = await import('./UsersDrawerItem.js');
  return { default: UsersDrawerItem };
});

const UsersAdministration = React.lazy(async () => {
  const { UsersAdministration } = await import('./UsersAdministration.js');
  return { default: UsersAdministration };
});

export interface IUserDetailsInfoProps {
  user: AdminUser;
}

@injectable()
export class UsersAdministrationService extends Bootstrap {
  readonly userDetailsInfoPlaceholder = new PlaceholderContainer<IUserDetailsInfoProps>();

  constructor(
    private readonly administrationItemService: AdministrationItemService,
    private readonly createUserService: CreateUserService,
    private readonly teamsResource: TeamsResource,
    private readonly createTeamService: CreateTeamService,
    private readonly usersResource: UsersResource,
  ) {
    super();
  }

  override register() {
    this.administrationItemService.create({
      name: UsersAdministrationNavigationService.ItemName,
      order: 4,
      sub: [
        {
          name: EUsersAdministrationSub.MetaProperties,
        },
        {
          name: EUsersAdministrationSub.Users,
          onDeActivate: this.cancelUserCreate.bind(this),
        },
        {
          name: EUsersAdministrationSub.Teams,
          onActivate: this.loadTeams.bind(this),
          onDeActivate: this.cancelTeamCreate.bind(this),
        },
      ],
      defaultSub: EUsersAdministrationSub.Users,
      getContentComponent: () => UsersAdministration,
      getDrawerComponent: () => UsersDrawerItem,
    });
    this.userDetailsInfoPlaceholder.add(UserCredentialsList, 0);
  }

  private cancelUserCreate(param: string | null, configurationWizard: boolean, outside: boolean) {
    if (param === 'create') {
      this.createUserService.close();
    }

    if (outside) {
      this.usersResource.cleanNewFlags();
    }
  }

  private cancelTeamCreate(param: string | null, configurationWizard: boolean, outside: boolean) {
    if (param === 'create') {
      this.createTeamService.dispose();
    }

    if (outside) {
      this.teamsResource.cleanNewFlags();
    }
  }

  private loadTeams(param: string | null) {
    if (param === 'create') {
      this.createTeamService.fillData();
    }
  }
}
