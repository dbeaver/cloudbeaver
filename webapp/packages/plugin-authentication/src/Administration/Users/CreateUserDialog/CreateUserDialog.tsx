/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  SubmittingForm, ErrorMessage, InputField, Checkbox, useFocus
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { CreateUserDialogController } from './CreateUserDialogController';
import { CreateUserDialogFooter } from './CreateUserDialogFooter';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-secondary theme-text-on-secondary from global;
    }
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    CommonDialogWrapper {
      min-height: 400px;
      min-width: 600px;
    }
    SubmittingForm {
      overflow: auto;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    SubmittingForm, create-form {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    create-form {
      flex-direction: column;
      padding: 18px 24px;
    }
    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }
  `
);

export const CreateUserDialog = observer(function CreateUserDialog({
  rejectDialog,
}: DialogComponentProps<null, null>) {
  const [focusedRef] = useFocus({ focusFirstChild: true });
  const controller = useController(CreateUserDialogController, rejectDialog);
  const translate = useTranslate();
  const handleLoginChange = useCallback(
    (value: string) => controller.credentials.login = value,
    []
  );
  const handlePasswordChange = useCallback(
    (value: string) => controller.credentials.password = value,
    []
  );
  const handlePasswordRepeatChange = useCallback(
    (value: string) => controller.credentials.passwordRepeat = value,
    []
  );
  const handleRoleChange = useCallback(
    (roleId: string, value: boolean) => controller.credentials.roles.set(roleId, value),
    []
  );

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={translate('authentication_create_user_dialog_title')}
      noBodyPadding
      footer={(
        <CreateUserDialogFooter
          isFormFilled={controller.isFormFilled}
          isCreating={controller.isCreating}
          onCancel={rejectDialog}
          onCreate={controller.create}
        />
      )}
      onReject={rejectDialog}
    >
      <SubmittingForm onSubmit={controller.create} autoComplete="disabled" ref={focusedRef as React.RefObject<HTMLFormElement>}>
        <create-form as='div'>
          <group as="div">
            <InputField
              type='text'
              name='login'
              value={controller.credentials.login}
              onChange={handleLoginChange}
              disabled={controller.isCreating}
              mod='surface'
            >
              {translate('authentication_user_name')}
            </InputField>
          </group>
          <group as="div">
            <InputField
              type='password'
              name='password'
              value={controller.credentials.password}
              onChange={handlePasswordChange}
              disabled={controller.isCreating}
              mod='surface'
            >
              {translate('authentication_user_password')}
            </InputField>
          </group>
          <group as="div">
            <InputField
              type='password'
              name='password_repeat'
              value={controller.credentials.passwordRepeat}
              onChange={handlePasswordRepeatChange}
              disabled={controller.isCreating}
              mod='surface'
            >
              {translate('authentication_user_password_repeat')}
            </InputField>
          </group>
          {controller.roles.map((role, i) => (
            <group as="div" key={role.roleId}>
              <Checkbox
                type='checkbox'
                name='role'
                checkboxLabel={role.roleName || role.roleId}
                onChange={checked => handleRoleChange(role.roleId, checked)}
                checked={controller.credentials.roles.get(role.roleId)}
                disabled={controller.isCreating}
                mod='surface'
              >
                {i === 0 && translate('authentication_user_role')}
              </Checkbox>
            </group>
          ))}
        </create-form>
      </SubmittingForm>
      {controller.error.responseMessage && (
        <ErrorMessage
          text={controller.error.responseMessage}
          hasDetails={controller.error.hasDetails}
          onShowDetails={controller.showDetails}
        />
      )}
    </CommonDialogWrapper>
  );
});
