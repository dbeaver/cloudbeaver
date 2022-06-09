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

import { UserMetaParametersResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, ColoredContainer, FieldCheckbox, Group, GroupTitle, InputField, Loader, ObjectPropertyInfoForm, useDataResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
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
  const userMetaParameters = useDataResource(UserInfo, UserMetaParametersResource, undefined);

  const handleRoleChange = useCallback(
    (roleId: string, value: boolean) => { controller.credentials.roles.set(roleId, value); },
    []
  );

  return styled(style)(
    <ColoredContainer parent gap overflow>
      <Group small gap vertical overflow>
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
      </Group>
      <Group small gap overflow>
        <GroupTitle>{translate('authentication_user_status')}</GroupTitle>
        <FieldCheckbox
          id={`${controller.user.userId}_user_enabled`}
          name='enabled'
          state={controller}
          disabled={controller.isSaving}
        >
          {translate('authentication_user_enabled')}
        </FieldCheckbox>
        <GroupTitle>{translate('authentication_user_role')}</GroupTitle>
        {controller.roles.map(role => {
          const label = `${role.roleId}${role.roleName && role.roleName !== role.roleId ? ' (' + role.roleName + ')' : ''}`;
          const tooltip = `${label}${role.description ? '\n' + role.description : ''}`;
          return (
            <FieldCheckbox
              key={role.roleId}
              id={`${controller.user.userId}_${role.roleId}`}
              title={tooltip}
              name='role'
              checked={!!controller.credentials.roles.get(role.roleId)}
              disabled={controller.isSaving}
              onChange={checked => handleRoleChange(role.roleId, checked)}
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
