/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import {
  ColoredContainer,
  ConfirmationDialog,
  Container,
  Form,
  Group,
  GroupTitle,
  InputField,
  ToolsAction,
  ToolsPanel,
  useCustomInputValidation,
  useExecutor,
  useForm,
  useObservableRef,
  usePasswordValidation,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { isValuesEqual } from '@cloudbeaver/core-utils';

import { userProfileContext } from '../../userProfileContext.js';
import { UserProfileOptionsPanelService } from '../../UserProfileOptionsPanelService.js';

export const ChangePassword = observer(function ChangePassword() {
  const translate = useTranslate();
  const state = useObservableRef(
    {
      oldPassword: '',
      password: '',
      repeatedPassword: '',
    },
    {
      oldPassword: observable.ref,
      password: observable.ref,
      repeatedPassword: observable.ref,
    },
  );
  const notificationService = useService(NotificationService);
  const userProfileOptionsPanelService = useService(UserProfileOptionsPanelService);
  const userInfoResource = useService(UserInfoResource);
  const commonDialogService = useService(CommonDialogService);
  const disabled = userInfoResource.isLoading();
  const passwordValidationRef = usePasswordValidation();
  const passwordRepeatRef = useCustomInputValidation<string>(value => {
    if (!isValuesEqual(value, state.password, null)) {
      return translate('authentication_user_passwords_not_match');
    }
    return null;
  });

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

  function resetForm() {
    state.oldPassword = '';
    state.password = '';
    state.repeatedPassword = '';
    form.ref?.reset();
  }

  useExecutor({
    executor: userProfileOptionsPanelService.onClose,
    handlers: [
      async function closeHandler(_, contexts) {
        const context = contexts.getContext(userProfileContext);

        if ((state.oldPassword || state.password || state.repeatedPassword) && !context.force) {
          const result = await commonDialogService.open(ConfirmationDialog, {
            title: 'plugin_user_profile_authentication_change_password_cancel_title',
            message: 'plugin_user_profile_authentication_change_password_cancel_message',
            confirmActionText: 'ui_processing_ok',
          });

          if (result === DialogueStateResult.Rejected) {
            ExecutorInterrupter.interrupt(contexts);
          }
        }
      },
    ],
  });

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
              >
                {translate('plugin_user_profile_authentication_change_password_new_password')}
              </InputField>
              <InputField
                ref={passwordRepeatRef}
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
