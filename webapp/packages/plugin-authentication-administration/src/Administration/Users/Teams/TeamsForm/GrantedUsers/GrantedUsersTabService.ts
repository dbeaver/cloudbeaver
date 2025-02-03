/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { TeamsAdministrationFormService } from '../TeamsAdministrationFormService.js';
import { getGrantedUsersFormPart } from './getGrantedUsersFormPart.js';

const GrantedUsers = React.lazy(async () => {
  const { GrantedUsers } = await import('./GrantedUsers.js');
  return { default: GrantedUsers };
});

@injectable()
export class GrantedUsersTabService extends Bootstrap {
  private readonly key: string;

  constructor(private readonly teamsAdministrationFormService: TeamsAdministrationFormService) {
    super();
    this.key = 'granted-users';
  }

  override register(): void {
    this.teamsAdministrationFormService.parts.add({
      key: this.key,
      name: 'administration_teams_team_granted_users_tab_title',
      title: 'administration_teams_team_granted_users_tab_title',
      order: 2,
      stateGetter: props => () => getGrantedUsersFormPart(props.formState),
      panel: () => GrantedUsers,
    });
  }
}
