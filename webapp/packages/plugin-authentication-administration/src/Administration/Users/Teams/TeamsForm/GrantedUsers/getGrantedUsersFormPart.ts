/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { TeamRolesResource, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import { createDataContext, DATA_CONTEXT_DI_PROVIDER } from '@cloudbeaver/core-data-context';
import type { IFormState } from '@cloudbeaver/core-ui';

import type { ITeamFormState } from '../TeamsAdministrationFormService.js';
import { GrantedUsersFormPart } from './GrantedUsersFormPart.js';

const DATA_CONTEXT_TEAM_FORM_GRANTED_USERS_PART = createDataContext<GrantedUsersFormPart>('Team Form Granted Users Part');

export function getGrantedUsersFormPart(formState: IFormState<ITeamFormState>): GrantedUsersFormPart {
  return formState.getPart(DATA_CONTEXT_TEAM_FORM_GRANTED_USERS_PART, context => {
    const di = context.get(DATA_CONTEXT_DI_PROVIDER)!;
    const teamsResource = di.getService(TeamsResource);
    const usersResource = di.getService(UsersResource);
    const teamRolesResource = di.getService(TeamRolesResource);

    return new GrantedUsersFormPart(formState, teamsResource, usersResource, teamRolesResource);
  });
}
