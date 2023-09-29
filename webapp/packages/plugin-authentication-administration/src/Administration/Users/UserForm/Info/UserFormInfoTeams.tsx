/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { compareTeams, TeamsResource } from '@cloudbeaver/core-authentication';
import { FieldCheckbox, Group, GroupTitle, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { isDefined } from '@cloudbeaver/core-utils';

import type { UserFormProps } from '../AdministrationUserFormService';
import type { UserFormInfoPart } from './UserFormInfoPart';

interface Props extends UserFormProps {
  tabState: UserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoTeams = observer<Props>(function UserFormInfoTeams({ formState, tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const teamsLoader = useResource(UserFormInfoTeams, TeamsResource, CachedMapAllKey, { active: tabSelected });
  const teams = teamsLoader.data.filter(isDefined).sort(compareTeams);
  return (
    <>
      <GroupTitle>{translate('authentication_user_team')}</GroupTitle>
      <Group boxNoOverflow gap dense>
        {teams.map(team => {
          const label = `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;
          const tooltip = `${label}${team.description ? '\n' + team.description : ''}`;
          return (
            <FieldCheckbox
              key={team.teamId}
              id={`${formState.id}_${team.teamId}`}
              title={tooltip}
              name="teams"
              state={tabState.state}
              value={team.teamId}
              disabled={disabled}
            >
              {label}
            </FieldCheckbox>
          );
        })}
      </Group>
    </>
  );
});
