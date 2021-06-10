/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, ColoredContainer, FieldCheckboxNew, Group, GroupTitle, InputFieldNew, TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { uuid } from '@cloudbeaver/core-utils';

import type { IUserFormProps } from './UserFormService';

export const UserInfo: TabContainerPanelComponent<IUserFormProps> = observer(function UserInfo({
  controller,
  editing,
}) {
  const translate = useTranslate();

  const handleRoleChange = useCallback(
    (roleId: string, value: boolean) => { controller.credentials.roles.set(roleId, value); },
    []
  );

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <ColoredContainer parent gap overflow>
      <Group small gap vertical>
        <GroupTitle>{translate('authentication_user_credentials')}</GroupTitle>
        <InputFieldNew
          type='text'
          name='login'
          state={controller.credentials}
          disabled={controller.isSaving}
          readOnly={editing}
          mod='surface'
          tiny
          required
        >
          {translate('authentication_user_name')}
        </InputFieldNew>
        {controller.local && (
          <>
            <InputFieldNew
              type='password'
              name='password'
              state={controller.credentials}
              autoComplete='new-password'
              placeholder={editing ? '••••••' : ''}
              disabled={controller.isSaving}
              mod='surface'
              tiny
              required
            >
              {translate('authentication_user_password')}
            </InputFieldNew>
            <InputFieldNew
              type='password'
              name='passwordRepeat'
              state={controller.credentials}
              placeholder={editing ? '••••••' : ''}
              disabled={controller.isSaving}
              mod='surface'
              tiny
              required
            >
              {translate('authentication_user_password_repeat')}
            </InputFieldNew>
          </>
        )}
      </Group>
      <Group small gap>
        <GroupTitle>{translate('authentication_user_role')}</GroupTitle>
        {controller.roles.map(role => (
          <FieldCheckboxNew
            key={role.roleId}
            id={uuid()}
            name='role'
            checked={!!controller.credentials.roles.get(role.roleId)}
            disabled={controller.isSaving}
            onChange={checked => handleRoleChange(role.roleId, checked)}
          >
            {role.roleName || role.roleId}
          </FieldCheckboxNew>
        ))}
      </Group>
    </ColoredContainer>
  );
});
