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
  SubmittingForm, ErrorMessage, InputField, Checkbox
} from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { DialogComponent, CommonDialogWrapper } from '@dbeaver/core/dialogs';
import { useTranslate } from '@dbeaver/core/localization';
import { composes, useStyles } from '@dbeaver/core/theming';

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

export const CreateUserDialog: DialogComponent<null, null> = observer(
  function CreateUserDialog(props) {
    const controller = useController(CreateUserDialogController, props.rejectDialog);
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
            isCreating={controller.isCreating}
            onCancel={props.rejectDialog}
            onCreate={controller.create}
          />
        )}
        onReject={props.rejectDialog}
      >
        <SubmittingForm onSubmit={controller.create} autoComplete="disabled">
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
  }
);
