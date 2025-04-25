/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { compareTeams, TeamsResource } from '@cloudbeaver/core-authentication';
import { FieldCheckbox, Group, GroupTitle, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { isDefined } from '@dbeaver/js-helpers';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormInfoPart } from './UserFormInfoPart.js';

interface Props extends UserFormProps {
  tabState: UserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoTeams = observer<Props>(function UserFormInfoTeams({ formState, tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const serverConfigResource = useResource(UserFormInfoTeams, ServerConfigResource, undefined);
  const teamsLoader = useResource(UserFormInfoTeams, TeamsResource, CachedMapAllKey, { active: tabSelected });
  const teams = teamsLoader.data.filter(isDefined).sort(compareTeams);
  const defaultTeam = serverConfigResource.data?.defaultUserTeam;

  return (
    <>
      <GroupTitle>{translate('authentication_user_team')}</GroupTitle>
      <Group boxNoOverflow box gap dense>
        {teams.map(team => {
          const isDefault = team.teamId === defaultTeam;
          const label = `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;
          const tooltip = `${label}${team.description ? '\n' + team.description : ''}`;

          return (
            <FieldCheckbox
              key={team.teamId}
              id={`${formState.id}_${team.teamId}`}
              title={tooltip}
              label={label}
              name="teams"
              state={tabState.state}
              value={team.teamId}
              caption={isDefault ? translate('plugin_authentication_administration_user_team_default_readonly_tooltip') : undefined}
              readOnly={isDefault}
              disabled={disabled}
            />
          );
        })}
      </Group>
    </>
  );
});
