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
  SubmittingForm, ErrorMessage, InputField
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
      margin: auto;
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
    const handleRoleChange = useCallback(
      (value: string) => controller.credentials.role = value,
      []
    );

    return styled(useStyles(styles))(
      <CommonDialogWrapper
        title={translate('authentication_create_user_dialog_title')}
        noBodyPadding
        footer={(
          <CreateUserDialogFooter
            isCreating={controller.isCreating}
            onCreate={controller.create}
          />
        )}
        onReject={props.rejectDialog}
      >
        <SubmittingForm onSubmit={controller.create}>
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
                type='role'
                name='text'
                value={controller.credentials.role}
                onChange={handleRoleChange}
                disabled={controller.isCreating}
                mod='surface'
              >
                {translate('authentication_user_role')}
              </InputField>
            </group>
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
