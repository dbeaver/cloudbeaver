/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { AuthRolesResource, UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, ColoredContainer, Container, FieldCheckbox, Group, GroupTitle, InputField, Loader, ObjectPropertyInfoForm, useResource, useTranslate, useStyles, Combobox } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IUserFormProps } from './UserFormService';

const styles = css`
  Group {
    height: 100%;
  }
`;

export const UserInfo: TabContainerPanelComponent<IUserFormProps> = observer(function UserInfo({
  controller,
  editing,
}) {
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const translate = useTranslate();
  const userMetaParameters = useResource(UserInfo, UserMetaParametersResource, undefined);
  const authRoles = useResource(UserInfo, AuthRolesResource, undefined);

  const handleTeamChange = useCallback(
    (teamId: string, value: boolean) => { controller.credentials.teams.set(teamId, value); },
    []
  );

  return styled(style)(
    <ColoredContainer gap overflow>
      <Group small gap vertical overflow>
        <Container gap vertical>
          <GroupTitle keepSize>{translate('authentication_user_credentials')}</GroupTitle>
          <InputField
            type='text'
            name='login'
            state={controller.credentials}
            disabled={controller.isSaving}
            readOnly={editing}
            mod='surface'
            keepSize
            tiny
            required
          >
            {translate('authentication_user_name')}
          </InputField>
          {controller.local && (
            <>
              <InputField
                type='password'
                name='password'
                state={controller.credentials}
                autoComplete='new-password'
                placeholder={editing ? '••••••' : ''}
                disabled={controller.isSaving}
                mod='surface'
                keepSize
                tiny
                required
              >
                {translate('authentication_user_password')}
              </InputField>
              <InputField
                type='password'
                name='passwordRepeat'
                state={controller.credentials}
                placeholder={editing ? '••••••' : ''}
                disabled={controller.isSaving}
                mod='surface'
                keepSize
                tiny
                required
              >
                {translate('authentication_user_password_repeat')}
              </InputField>
            </>
          )}
        </Container>
      </Group>
      <Group small gap overflow>
        {authRoles.data.length > 0 && (
          <Combobox
            name='authRole'
            state={controller.credentials}
            items={authRoles.data}
            keySelector={value => value}
            valueSelector={value => value}
            disabled={controller.isSaving}
          >
            {translate('authentication_user_role')}
          </Combobox>
        )}
        <GroupTitle>{translate('authentication_user_status')}</GroupTitle>
        <FieldCheckbox
          id={`${controller.user.userId}_user_enabled`}
          name='enabled'
          state={controller}
          disabled={controller.isSaving}
        >
          {translate('authentication_user_enabled')}
        </FieldCheckbox>
        <GroupTitle>{translate('authentication_user_team')}</GroupTitle>
        {controller.teams.map(team => {
          const label = `${team.teamId}${team.teamName && team.teamName !== team.teamId ? ' (' + team.teamName + ')' : ''}`;
          const tooltip = `${label}${team.description ? '\n' + team.description : ''}`;
          return (
            <FieldCheckbox
              key={team.teamId}
              id={`${controller.user.userId}_${team.teamId}`}
              title={tooltip}
              name='team'
              checked={!!controller.credentials.teams.get(team.teamId)}
              disabled={controller.isSaving}
              onChange={checked => handleTeamChange(team.teamId, checked)}
            >
              {label}
            </FieldCheckbox>
          );
        })}
      </Group>
      <Loader state={userMetaParameters} inline>
        {() => userMetaParameters.data.length > 0 && styled(style)(
          <Group small gap vertical overflow>
            <GroupTitle keepSize>{translate('authentication_user_meta_parameters')}</GroupTitle>
            <ObjectPropertyInfoForm
              state={controller.credentials.metaParameters}
              properties={userMetaParameters.data}
              disabled={controller.isSaving}
              keepSize
              tiny
            />
          </Group>
        )}
      </Loader>
    </ColoredContainer>
  );
});
