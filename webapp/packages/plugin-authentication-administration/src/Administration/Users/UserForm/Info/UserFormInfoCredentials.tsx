/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, isLocalUser, UsersResource } from '@cloudbeaver/core-authentication';
import {
  Container,
  GroupTitle,
  InputField,
  useCustomInputValidation,
  usePasswordValidation,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { FormMode } from '@cloudbeaver/core-ui';
import { isValuesEqual } from '@cloudbeaver/core-utils';

import type { UserFormProps } from '../AdministrationUserFormService.js';
import type { UserFormInfoPart } from './UserFormInfoPart.js';
import { ENTITY_ID_VALIDATION } from '../../shared/ENTITY_ID_VALIDATION.js';

const PASSWORD_PLACEHOLDER = '••••••';

interface Props extends UserFormProps {
  tabState: UserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoCredentials = observer<Props>(function UserFormInfoCredentials({ formState, tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const editing = formState.mode === FormMode.Edit;
  const userInfo = useResource(UserFormInfoCredentials, UsersResource, tabState.initialState.userId, { active: tabSelected && editing });
  const authProvidersResource = useResource(UserFormInfoCredentials, AuthProvidersResource, null);
  const passwordValidationRef = usePasswordValidation();

  let local = authProvidersResource.resource.isEnabled(AUTH_PROVIDER_LOCAL_ID);

  if (!local) {
    local = !editing || (!!userInfo.data && isLocalUser(userInfo.data));
  }

  const usernameValidationRef = useCustomInputValidation<string>(value => {
    if (!value.match(ENTITY_ID_VALIDATION)) {
      return translate('plugin_authentication_administration_user_username_validation_error');
    }

    return null;
  });

  const passwordRepeatRef = useCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, tabState.state.password, null)) {
      return translate('authentication_user_passwords_not_match');
    }
    return null;
  });

  return (
    <Container gap vertical>
      <GroupTitle keepSize>{translate('authentication_user_credentials')}</GroupTitle>
      <InputField
        ref={usernameValidationRef}
        description={!editing ? translate('authentication_user_name_description') : undefined}
        type="text"
        name="userId"
        state={tabState.state}
        readOnly={editing || disabled}
        keepSize
        tiny
        required
      >
        {translate('authentication_user_name')}
      </InputField>
      {local && (
        <>
          <InputField
            ref={passwordValidationRef}
            type="password"
            name="password"
            state={tabState.state}
            autoComplete="new-password"
            placeholder={editing ? PASSWORD_PLACEHOLDER : ''}
            canShowPassword={tabState.state['password'] !== ''}
            readOnly={disabled}
            required={!editing}
            keepSize
            tiny
          >
            {translate('authentication_user_password')}
          </InputField>
          <InputField
            ref={passwordRepeatRef}
            type="password"
            name="passwordRepeat"
            placeholder={editing ? PASSWORD_PLACEHOLDER : ''}
            readOnly={disabled}
            required={!editing}
            canShowPassword
            keepSize
            tiny
          >
            {translate('authentication_user_password_repeat')}
          </InputField>
        </>
      )}
    </Container>
  );
});
