/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Form, Group, GroupTitle, InputField, useCustomInputValidation, usePasswordValidation, useTranslate } from '@cloudbeaver/core-blocks';
import { isValuesEqual } from '@cloudbeaver/core-utils';

import type { IUserProfileFormAuthenticationState } from './IUserProfileFormAuthenticationState';

interface Props {
  state: IUserProfileFormAuthenticationState;
  disabled?: boolean;
}

export const ChangePassword = observer<Props>(function ChangePassword({ state, disabled }) {
  const translate = useTranslate();
  const passwordValidationRef = usePasswordValidation();
  const passwordRepeatRef = useCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, state.password, null)) {
      return translate('authentication_user_passwords_not_match');
    }
    return null;
  });

  return (
    <Form>
      <Group form gap>
        <GroupTitle>{translate('plugin_user_profile_authentication_change_password')}</GroupTitle>
        <InputField
          type="password"
          name="oldPassword"
          state={state}
          disabled={disabled}
          mapValue={(value?: string) => value?.trim() ?? ''}
          small
          required
        >
          {translate('plugin_user_profile_authentication_change_password_current_password')}
        </InputField>
        <InputField
          ref={passwordValidationRef}
          type="password"
          name="password"
          autoComplete="new-password"
          state={state}
          disabled={disabled}
          mapValue={(value?: string) => value?.trim() ?? ''}
          small
          required
        >
          {translate('plugin_user_profile_authentication_change_password_new_password')}
        </InputField>
        <InputField
          ref={passwordRepeatRef}
          type="password"
          name="repeatedPassword"
          state={state}
          disabled={disabled}
          mapValue={(value?: string) => value?.trim() ?? ''}
          small
          required
        >
          {translate('plugin_user_profile_authentication_change_password_repeat_password')}
        </InputField>
      </Group>
    </Form>
  );
});
