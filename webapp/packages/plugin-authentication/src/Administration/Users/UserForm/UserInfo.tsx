/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';

import { FieldCheckbox, FormBox, FormBoxElement, FormGroup, InputField, InputGroup, TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { IUserFormProps } from './UserFormService';

export const UserInfo: TabContainerPanelComponent<IUserFormProps> = observer(function UserInfo({
  controller,
  editing,
}) {
  const translate = useTranslate();

  const handleLoginChange = useCallback(
    (value: string) => { controller.credentials.login = value; },
    []
  );
  const handlePasswordChange = useCallback(
    (value: string) => { controller.credentials.password = value; },
    []
  );
  const handlePasswordRepeatChange = useCallback(
    (value: string) => { controller.credentials.passwordRepeat = value; },
    []
  );
  const handleRoleChange = useCallback(
    (roleId: string, value: boolean) => { controller.credentials.roles.set(roleId, value); },
    []
  );

  return (
    <FormBox>
      <FormBoxElement>
        <FormGroup>
          <InputGroup>{translate('authentication_user_credentials')}</InputGroup>
        </FormGroup>
        <FormGroup>
          <InputField
            type='text'
            name='login'
            value={controller.credentials.login}
            disabled={controller.isSaving}
            readOnly={editing}
            mod='surface'
            required
            onChange={handleLoginChange}
          >
            {translate('authentication_user_name')}
          </InputField>
        </FormGroup>
        {controller.local && (
          <>
            <FormGroup>
              <InputField
                type='password'
                name='password'
                autoComplete='new-password'
                value={controller.credentials.password}
                disabled={controller.isSaving}
                mod='surface'
                required
                onChange={handlePasswordChange}
              >
                {translate('authentication_user_password')}
              </InputField>
            </FormGroup>
            <FormGroup>
              <InputField
                type='password'
                name='password_repeat'
                value={controller.credentials.passwordRepeat}
                disabled={controller.isSaving}
                mod='surface'
                required
                onChange={handlePasswordRepeatChange}
              >
                {translate('authentication_user_password_repeat')}
              </InputField>
            </FormGroup>
          </>
        )}
      </FormBoxElement>
      <FormBoxElement>
        <FormGroup>
          <InputGroup>{translate('authentication_user_role')}</InputGroup>
        </FormGroup>
        {controller.roles.map((role, i) => (
          <FormGroup key={role.roleId}>
            <FieldCheckbox
              value={role.roleId}
              name='role'
              checkboxLabel={role.roleName || role.roleId}
              checked={!!controller.credentials.roles.get(role.roleId)}
              disabled={controller.isSaving}
              mod='surface'
              onChange={checked => handleRoleChange(role.roleId, checked)}
            />
          </FormGroup>
        ))}
      </FormBoxElement>
    </FormBox>
  );
});
