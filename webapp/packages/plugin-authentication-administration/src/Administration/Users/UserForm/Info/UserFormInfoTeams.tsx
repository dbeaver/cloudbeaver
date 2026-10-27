/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { compareTeams, TeamsResource, UsersGrantedTeamsResource, type TeamInfo } from '@cloudbeaver/core-authentication';
import { FieldCheckbox, Group, GroupTitle, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { isDefined } from '@dbeaver/js-helpers';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormInfoPart } from './UserFormInfoPart.js';
import { useTeamGrantLabel, type ITeamGrantSource } from '../../useTeamGrantLabel.js';

interface Props extends UserFormProps {
  tabState: UserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoTeams = observer<Props>(function UserFormInfoTeams({ formState, tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const getGrantLabel = useTeamGrantLabel();
  const serverConfigResource = useResource(UserFormInfoTeams, ServerConfigResource, undefined);
  const teamsLoader = useResource(UserFormInfoTeams, TeamsResource, CachedMapAllKey, { active: tabSelected });
  const grantedTeams = useResource(UserFormInfoTeams, UsersGrantedTeamsResource, formState.state.userId, {
    active: tabSelected && !!formState.state.userId,
  });
  const teams = teamsLoader.data.filter(isDefined).sort(compareTeams);
  const defaultTeam = serverConfigResource.data?.defaultUserTeam;

  function getLabel(team: TeamInfo): string {
    return `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;
  }

  function getTooltip(team: TeamInfo, grant: ITeamGrantSource | undefined): string {
    const tooltip = `${getLabel(team)}${team.description ? '\n' + team.description : ''}`;

    if (team.teamId === defaultTeam) {
      return `${tooltip}\n${translate('plugin_authentication_administration_team_grant_default_tooltip')}\n${translate('plugin_authentication_administration_user_team_default_readonly_tooltip')}`;
    }

    if (grant?.grantType === 'AUTH_PROVIDER') {
      return `${tooltip}\n${translate('plugin_authentication_administration_team_grant_provider_tooltip')}`;
    }

    return tooltip;
  }

  return (
    <>
      <GroupTitle>{translate('authentication_user_team')}</GroupTitle>
      <Group boxNoOverflow box gap dense>
        {teams.map(team => {
          const isDefault = team.teamId === defaultTeam;
          const isGranted = isDefault || tabState.state.teams.includes(team.teamId);
          const grant: ITeamGrantSource | undefined = isDefault
            ? { grantType: 'DEFAULT' }
            : isGranted
              ? (grantedTeams.data?.find(grant => grant.teamId === team.teamId) ?? { grantType: 'MANUAL' })
              : undefined;

          return (
            <FieldCheckbox
              key={team.teamId}
              id={`${formState.id}_${team.teamId}`}
              title={getTooltip(team, grant)}
              label={getLabel(team)}
              name="teams"
              state={tabState.state}
              value={team.teamId}
              caption={isGranted ? getGrantLabel(grant) : undefined}
              readOnly={isDefault}
              disabled={disabled}
            />
          );
        })}
      </Group>
    </>
  );
});
