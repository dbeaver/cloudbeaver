/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { compareTeams, TeamsResource, UsersResource } from '@cloudbeaver/core-authentication';
import { FieldCheckbox, Group, GroupTitle, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { isDefined } from '@dbeaver/js-helpers';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormInfoPart } from './UserFormInfoPart.js';
import { getUserFormTeamPresentation } from './getUserFormTeamPresentation.js';

interface Props extends UserFormProps {
  tabState: UserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoTeams = observer<Props>(function UserFormInfoTeams({ formState, tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const serverConfigResource = useResource(UserFormInfoTeams, ServerConfigResource, undefined);
  const teamsLoader = useResource(UserFormInfoTeams, TeamsResource, CachedMapAllKey, { active: tabSelected });
  const user = useResource(UserFormInfoTeams, UsersResource, formState.state.userId, {
    active: tabSelected && !!formState.state.userId,
  });
  const teams = teamsLoader.data.filter(isDefined).sort(compareTeams);
  const defaultTeam = serverConfigResource.data?.defaultUserTeam;

  return (
    <>
      <GroupTitle>{translate('authentication_user_team')}</GroupTitle>
      <Group boxNoOverflow box gap dense>
        {teams.map(team => {
          const grant = user.data?.grantedTeamsInfo.find(grant => grant.teamId === team.teamId);
          const isDefault = team.teamId === defaultTeam;
          const { label, caption, tooltip } = getUserFormTeamPresentation(translate, {
            team,
            grant,
            isDefault,
            isGranted: tabState.state.teams.includes(team.teamId),
          });

          return (
            <FieldCheckbox
              key={team.teamId}
              id={`${formState.id}_${team.teamId}`}
              title={tooltip}
              label={label}
              name="teams"
              state={tabState.state}
              value={team.teamId}
              caption={caption}
              readOnly={isDefault}
              disabled={disabled}
            />
          );
        })}
      </Group>
    </>
  );
});
