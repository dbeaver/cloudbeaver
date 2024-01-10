/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Button, Form, Group, GroupItem, GroupTitle, InputField, useForm, useTranslate } from '@cloudbeaver/core-blocks';

import { useChangePassword } from './useChangePassword';

export const ChangePassword = observer(function ChangePassword() {
  const translate = useTranslate();
  const state = useChangePassword();
  const disabled = state.submitting;
  const form = useForm({
    onSubmit: state.changePassword,
  });

  return (
    <Form context={form}>
      <Group form gap>
        <GroupTitle>{translate('plugin_user_profile_authentication_change_password')}</GroupTitle>
        <InputField type="password" name="oldPassword" state={state.config} disabled={disabled} mapValue={value => value.trim()} small required>
          {translate('plugin_user_profile_authentication_change_password_current_password')}
        </InputField>
        <InputField
          type="password"
          name="password"
          autoComplete="new-password"
          state={state.config}
          disabled={disabled}
          mapValue={value => value.trim()}
          small
          required
        >
          {translate('plugin_user_profile_authentication_change_password_new_password')}
        </InputField>
        <InputField type="password" name="repeatedPassword" state={state.config} disabled={disabled} mapValue={value => value.trim()} small required>
          {translate('plugin_user_profile_authentication_change_password_repeat_password')}
        </InputField>
        <GroupItem>
          <Button disabled={disabled || !state.formFilled} loading={state.submitting} type="button" mod={['unelevated']} onClick={() => form.submit()}>
            {translate('plugin_user_profile_authentication_change_password_submit_label')}
          </Button>
        </GroupItem>
      </Group>
    </Form>
  );
});
