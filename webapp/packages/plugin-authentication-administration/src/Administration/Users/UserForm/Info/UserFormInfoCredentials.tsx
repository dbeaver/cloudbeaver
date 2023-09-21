/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { isLocalUser, UsersResource } from '@cloudbeaver/core-authentication';
import { Container, GroupTitle, InputField, useCustomInputValidation, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { FormMode, useTabState } from '@cloudbeaver/core-ui';
import { isValuesEqual } from '@cloudbeaver/core-utils';

import type { UserFormProps } from '../AdministrationUserFormService';
import type { IUserFormInfoPart } from './IUserFormInfoPart';

const PASSWORD_PLACEHOLDER = '••••••';

interface Props extends UserFormProps {
  tabState: IUserFormInfoPart;
  tabSelected: boolean;
  disabled: boolean;
}

export const UserFormInfoCredentials = observer<Props>(function UserFormInfoCredentials({ formState, tabState, tabSelected, disabled }) {
  const translate = useTranslate();
  const editing = formState.mode === FormMode.Edit;
  const userInfo = useResource(
    UserFormInfoCredentials,
    UsersResource,
    { key: tabState.initialState.userId, includes: ['includeMetaParameters'] },
    { active: tabSelected && editing },
  );
  const local = !editing || (userInfo.data && isLocalUser(userInfo.data));

  const passwordRepeatRef = useCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, tabState.state.password, null)) {
      return translate('authentication_user_passwords_not_match');
    }
    return null;
  });

  return (
    <Container gap vertical>
      <GroupTitle keepSize>{translate('authentication_user_credentials')}</GroupTitle>
      <InputField type="text" name="userId" state={tabState.state} readOnly={editing} disabled={disabled} mod="surface" keepSize tiny required>
        {translate('authentication_user_name')}
      </InputField>
      {local && (
        <>
          <InputField
            type="password"
            name="password"
            state={tabState.state}
            autoComplete="new-password"
            placeholder={editing ? PASSWORD_PLACEHOLDER : ''}
            canShowPassword={tabState.state['password'] !== ''}
            disabled={disabled}
            mod="surface"
            keepSize
            tiny
            required={!editing}
          >
            {translate('authentication_user_password')}
          </InputField>
          <InputField
            ref={passwordRepeatRef}
            type="password"
            name="passwordRepeat"
            placeholder={editing ? PASSWORD_PLACEHOLDER : ''}
            disabled={disabled}
            canShowPassword
            mod="surface"
            keepSize
            tiny
            required={!editing}
          >
            {translate('authentication_user_password_repeat')}
          </InputField>
        </>
      )}
    </Container>
  );
});
