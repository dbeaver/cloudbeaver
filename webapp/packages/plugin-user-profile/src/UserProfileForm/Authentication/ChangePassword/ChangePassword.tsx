/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Button, Group, GroupItem, GroupTitle, InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { useChangePassword } from './useChangePassword';

export const ChangePassword = observer(function ChangePassword() {
  const translate = useTranslate();
  const state = useChangePassword();

  const disabled = state.submitting;

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Group form gap>
      <GroupTitle>{translate('plugin_user_profile_authentication_change_password')}</GroupTitle>
      <InputField
        type='password'
        name='oldPassword'
        state={state.config}
        disabled={disabled}
        mapValue={(value => value.trim())}
        small
        required
      >
        {translate('plugin_user_profile_authentication_change_password_current_password')}
      </InputField>
      <InputField
        type='password'
        name='password'
        autoComplete='new-password'
        state={state.config}
        disabled={disabled}
        mapValue={(value => value.trim())}
        small
        required
      >
        {translate('plugin_user_profile_authentication_change_password_new_password')}
      </InputField>
      <InputField
        type='password'
        name='repeatedPassword'
        state={state.config}
        disabled={disabled}
        mapValue={(value => value.trim())}
        small
        required
      >
        {translate('plugin_user_profile_authentication_change_password_repeat_password')}
      </InputField>
      <GroupItem>
        <Button
          disabled={disabled || !state.formFilled}
          loading={state.submitting}
          type="button"
          mod={['unelevated']}
          onClick={state.changePassword}
        >
          {translate('plugin_user_profile_authentication_change_password_submit_label')}
        </Button>
      </GroupItem>
    </Group>
  );
});
