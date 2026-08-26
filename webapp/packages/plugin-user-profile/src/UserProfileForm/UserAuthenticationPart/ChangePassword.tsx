/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  Container,
  Form,
  Group,
  GroupTitle,
  InputField,
  ToolsAction,
  ToolsPanel,
  useForm,
  useFormCustomInputValidation,
  usePasswordValidation,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { isValuesEqual } from '@cloudbeaver/core-utils';

import { UserProfileFormAuthenticationService } from './UserProfileFormAuthenticationService.js';

export const ChangePassword = observer(function ChangePassword() {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const userProfileFormAuthenticationPartStateService = useService(UserProfileFormAuthenticationService);
  const userInfoResource = useService(UserInfoResource);
  const state = userProfileFormAuthenticationPartStateService.state;
  const disabled = userInfoResource.isLoading();

  const form = useForm({
    async onSubmit() {
      try {
        await userInfoResource.updateLocalPassword(state.oldPassword, state.password);
        resetForm();
        notificationService.logSuccess({ title: 'plugin_user_profile_authentication_change_password_success' });
      } catch (exception) {
        if (exception instanceof Error) {
          notificationService.logException(exception);
        }
      }
    },
  });
  const passwordValidationRef = usePasswordValidation(form);
  const passwordRepeatValidation = useFormCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, state.password, null)) {
      return translate('authentication_user_passwords_not_match');
    }
    return null;
  }, form);

  function resetForm() {
    userProfileFormAuthenticationPartStateService.reset();
    form.ref?.reset();
  }

  return (
    <ColoredContainer wrap overflow gap>
      <Container medium gap>
        <Form context={form}>
          <ColoredContainer parent overflow compact vertical noWrap gap>
            <Group overflow box keepSize>
              <ToolsPanel rounded minHeight>
                <ToolsAction icon="admin-save" viewBox="0 0 24 24" onClick={() => form.submit()}>
                  {translate('plugin_user_profile_authentication_change_password_submit_label')}
                </ToolsAction>
                <ToolsAction icon="admin-cancel" viewBox="0 0 24 24" onClick={resetForm}>
                  {translate('ui_clear')}
                </ToolsAction>
              </ToolsPanel>
            </Group>

            <Group form gap>
              <GroupTitle>{translate('plugin_user_profile_authentication_change_password')}</GroupTitle>
              <InputField
                type="password"
                name="oldPassword"
                state={state}
                readOnly={disabled}
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
                readOnly={disabled}
                mapValue={(value?: string) => value?.trim() ?? ''}
                small
                required
                onChange={passwordRepeatValidation.revalidate}
              >
                {translate('plugin_user_profile_authentication_change_password_new_password')}
              </InputField>
              <InputField
                ref={passwordRepeatValidation.ref}
                type="password"
                name="repeatedPassword"
                state={state}
                readOnly={disabled}
                mapValue={(value?: string) => value?.trim() ?? ''}
                small
                required
              >
                {translate('plugin_user_profile_authentication_change_password_repeat_password')}
              </InputField>
            </Group>
          </ColoredContainer>
        </Form>
      </Container>
    </ColoredContainer>
  );
});
